const PDFDocument = require("pdfkit");
const db = require("../config/db");

async function tableExists(tableName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.tables
    WHERE table_schema = DATABASE()
      AND table_name = ?
    `,
    [tableName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function columnExists(tableName, columnName) {
  const [rows] = await db.query(
    `
    SELECT COUNT(*) AS count
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    `,
    [tableName, columnName]
  );

  return Number(rows[0]?.count || 0) > 0;
}

async function getPaymentsEffectiveDateExpression() {
  if (!(await tableExists("payments"))) return null;

  const columns = [];

  if (await columnExists("payments", "paid_at")) columns.push("p.paid_at");
  if (await columnExists("payments", "confirmed_at")) columns.push("p.confirmed_at");
  if (await columnExists("payments", "created_at")) columns.push("p.created_at");
  if (await columnExists("payments", "updated_at")) columns.push("p.updated_at");

  if (!columns.length) return null;

  return `COALESCE(${columns.join(", ")})`;
}

function parseRequestedMonth(value) {
  const raw = String(value || "").trim();
  const today = new Date();

  if (!raw) {
    return {
      key: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`,
      date: new Date(today.getFullYear(), today.getMonth(), 1),
    };
  }

  const match = raw.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    date: new Date(year, month - 1, 1),
  };
}

function formatSqlDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCurrency(value) {
  return `LKR ${Number(value || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-LK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function buildIncomeReportData(monthKey) {
  const effectiveDateExpr = await getPaymentsEffectiveDateExpression();

  if (!effectiveDateExpr) {
    return {
      monthKey,
      monthLabel: new Date(`${monthKey}-01`).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
      generatedAt: new Date(),
      totals: {
        totalIncome: 0,
        totalTransactions: 0,
        playArea: 0,
        classes: 0,
        partyArea: 0,
        other: 0,
      },
      paymentMethods: {
        cash: 0,
        card: 0,
        bankTransfer: 0,
      },
      transactions: [],
    };
  }

  const startDate = new Date(`${monthKey}-01T00:00:00`);
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);

  const hasBookings = await tableExists("bookings");
  const hasEnrollments = await tableExists("enrollments");
  const hasChildren = await tableExists("children");
  const hasClasses = await tableExists("classes");
  const hasUsers = await tableExists("users");

  const bookingJoin = hasBookings ? "LEFT JOIN bookings b ON b.id = p.booking_id" : "";
  const bookingUserJoin = hasBookings && hasUsers ? "LEFT JOIN users booking_user ON booking_user.id = b.user_id" : "";
  const enrollmentJoin = hasEnrollments ? "LEFT JOIN enrollments e ON e.id = p.enrollment_id" : "";
  const childJoin = hasEnrollments && hasChildren ? "LEFT JOIN children child ON child.id = e.child_id" : "";
  const classJoin = hasEnrollments && hasClasses ? "LEFT JOIN classes c ON c.id = e.class_id" : "";
  const parentUserJoin = hasUsers ? "LEFT JOIN users parent_user ON parent_user.id = p.parent_user_id" : "";

  const [rows] = await db.query(
    `
    SELECT
      p.id,
      p.payment_no,
      p.amount,
      p.payment_method,
      p.payment_status,
      p.reference_no,
      p.transaction_ref,
      ${effectiveDateExpr} AS effective_date,
      COALESCE(
        ${hasUsers ? "parent_user.full_name," : ""}
        ${hasBookings && hasUsers ? "booking_user.full_name," : ""}
        ${hasBookings ? "b.walk_in_customer_name," : ""}
        ${hasEnrollments && hasChildren ? "child.full_name," : ""}
        'Customer'
      ) AS customer_name,
      CASE
        WHEN p.enrollment_id IS NOT NULL THEN 'CLASSES'
        WHEN ${hasBookings ? "b.booking_type = 'PLAY_AREA'" : "0"} THEN 'PLAY_AREA'
        WHEN ${hasBookings ? "b.booking_type = 'PARTY'" : "0"} THEN 'PARTY_AREA'
        WHEN ${hasBookings ? "b.booking_type = 'CLASS'" : "0"} THEN 'CLASSES'
        ELSE 'OTHER'
      END AS income_source,
      CASE
        WHEN p.enrollment_id IS NOT NULL THEN ${hasEnrollments && hasClasses ? "COALESCE(c.title, 'Class Enrollment')" : "'Class Enrollment'"}
        WHEN ${hasBookings ? "b.booking_type = 'PLAY_AREA'" : "0"} THEN 'Play Area Booking'
        WHEN ${hasBookings ? "b.booking_type = 'PARTY'" : "0"} THEN 'Party Area Booking'
        WHEN ${hasBookings ? "b.booking_type = 'CLASS'" : "0"} THEN 'Class Booking'
        ELSE 'General Payment'
      END AS income_item
    FROM payments p
    ${parentUserJoin}
    ${bookingJoin}
    ${bookingUserJoin}
    ${enrollmentJoin}
    ${childJoin}
    ${classJoin}
    WHERE p.payment_status IN ('SUCCESS', 'PAID')
      AND ${effectiveDateExpr} IS NOT NULL
      AND ${effectiveDateExpr} >= ?
      AND ${effectiveDateExpr} < ?
    ORDER BY ${effectiveDateExpr} ASC, p.id ASC
    `,
    [formatSqlDate(startDate), formatSqlDate(endDate)]
  );

  const totals = {
    totalIncome: 0,
    totalTransactions: rows.length,
    playArea: 0,
    classes: 0,
    partyArea: 0,
    other: 0,
  };

  const paymentMethods = {
    cash: 0,
    card: 0,
    bankTransfer: 0,
  };

  const transactions = rows.map((row) => {
    const amount = Number(row.amount || 0);
    const method = String(row.payment_method || "").toUpperCase();
    const source = String(row.income_source || "OTHER").toUpperCase();

    totals.totalIncome += amount;

    if (source === "PLAY_AREA") totals.playArea += amount;
    else if (source === "CLASSES") totals.classes += amount;
    else if (source === "PARTY_AREA") totals.partyArea += amount;
    else totals.other += amount;

    if (method === "CASH") paymentMethods.cash += amount;
    else if (method === "CARD") paymentMethods.card += amount;
    else if (method === "BANK_TRANSFER") paymentMethods.bankTransfer += amount;

    return {
      receiptNo: row.payment_no || `PAY-${row.id}`,
      customerName: row.customer_name || "Customer",
      incomeSource:
        source === "PLAY_AREA"
          ? "Play Area"
          : source === "CLASSES"
          ? "Classes"
          : source === "PARTY_AREA"
          ? "Party Area"
          : "Other",
      itemName: row.income_item || "-",
      paymentMethod:
        method === "BANK_TRANSFER"
          ? "Bank Transfer"
          : method === "CARD"
          ? "Card"
          : method === "CASH"
          ? "Cash"
          : method || "-",
      amount,
      paymentDate: row.effective_date,
      referenceNo: row.transaction_ref || row.reference_no || "-",
    };
  });

  return {
    monthKey,
    monthLabel: startDate.toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    }),
    generatedAt: new Date(),
    totals,
    paymentMethods,
    transactions,
  };
}

function drawSummaryBox(doc, x, y, width, height, label, value, accentColor) {
  doc
    .save()
    .roundedRect(x, y, width, height, 14)
    .fillAndStroke("#ffffff", "#e9e4f5");

  doc
    .roundedRect(x, y, 6, height, 14)
    .fill(accentColor);

  doc
    .fillColor("#6b7280")
    .font("Helvetica")
    .fontSize(10)
    .text(label, x + 18, y + 16, { width: width - 28 });

  doc
    .fillColor("#111827")
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(value, x + 18, y + 36, { width: width - 28 });

  doc.restore();
}

function drawTableHeader(doc, startX, widths, topY) {
  const headers = ["Date", "Receipt No", "Source", "Customer", "Method", "Amount"];
  let x = startX;

  doc.save();
  doc.roundedRect(startX, topY, widths.reduce((a, b) => a + b, 0), 28, 8).fill("#f3f0fb");
  doc.fillColor("#3f3f46").font("Helvetica-Bold").fontSize(10);

  headers.forEach((header, index) => {
    doc.text(header, x + 8, topY + 9, {
      width: widths[index] - 16,
      ellipsis: true,
    });
    x += widths[index];
  });

  doc.restore();
}

function drawTransactionRow(doc, startX, widths, rowTop, item, shaded) {
  const rowHeight = 26;
  const totalWidth = widths.reduce((a, b) => a + b, 0);

  if (shaded) {
    doc.save().rect(startX, rowTop, totalWidth, rowHeight).fill("#fcfbff").restore();
  }

  const values = [
    formatDateTime(item.paymentDate),
    item.receiptNo,
    item.incomeSource,
    item.customerName,
    item.paymentMethod,
    formatCurrency(item.amount),
  ];

  let x = startX;
  doc.fillColor("#111827").font("Helvetica").fontSize(9.5);

  values.forEach((value, index) => {
    doc.text(String(value || "-"), x + 8, rowTop + 8, {
      width: widths[index] - 16,
      ellipsis: true,
    });
    x += widths[index];
  });

  doc
    .save()
    .moveTo(startX, rowTop + rowHeight)
    .lineTo(startX + totalWidth, rowTop + rowHeight)
    .strokeColor("#ece7f7")
    .lineWidth(1)
    .stroke()
    .restore();

  return rowHeight;
}

function renderIncomeReportPdf(res, report) {
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 36,
  });

  const fileName = `income-report-${report.monthKey}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;

  doc.roundedRect(left, 34, pageWidth, 82, 20).fill("#4b1fb8");

  doc
    .fillColor("#ffffff")
    .font("Helvetica-Bold")
    .fontSize(24)
    .text("Monthly Income Report", left + 24, 56);

  doc
    .font("Helvetica")
    .fontSize(11)
    .text("Poddo Play House", left + 24, 88)
    .text(`Report Month: ${report.monthLabel}`, left + 220, 88)
    .text(`Generated: ${formatDateTime(report.generatedAt)}`, left + 470, 88);

  const boxGap = 14;
  const boxWidth = (pageWidth - boxGap * 3) / 4;
  const summaryY = 136;

  drawSummaryBox(doc, left, summaryY, boxWidth, 78, "Total Income", formatCurrency(report.totals.totalIncome), "#4b1fb8");
  drawSummaryBox(doc, left + boxWidth + boxGap, summaryY, boxWidth, 78, "Play Area Income", formatCurrency(report.totals.playArea), "#10b981");
  drawSummaryBox(doc, left + (boxWidth + boxGap) * 2, summaryY, boxWidth, 78, "Classes Income", formatCurrency(report.totals.classes), "#f59e0b");
  drawSummaryBox(doc, left + (boxWidth + boxGap) * 3, summaryY, boxWidth, 78, "Party Area Income", formatCurrency(report.totals.partyArea), "#ef4444");

  let y = summaryY + 104;

  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(14).text("Summary", left, y);
  y += 24;

  const summaryLines = [
    `Total successful transactions: ${report.totals.totalTransactions}`,
    `Cash income: ${formatCurrency(report.paymentMethods.cash)}`,
    `Card income: ${formatCurrency(report.paymentMethods.card)}`,
    `Bank transfer income: ${formatCurrency(report.paymentMethods.bankTransfer)}`,
  ];

  summaryLines.forEach((line) => {
    doc.fillColor("#4b5563").font("Helvetica").fontSize(10.5).text(`• ${line}`, left, y);
    y += 18;
  });

  y += 10;

  doc.fillColor("#111827").font("Helvetica-Bold").fontSize(14).text("Transaction Details", left, y);
  y += 20;

  const widths = [110, 110, 90, 230, 95, 110];
  const totalTableWidth = widths.reduce((a, b) => a + b, 0);

  drawTableHeader(doc, left, widths, y);
  y += 32;

  if (!report.transactions.length) {
    doc
      .roundedRect(left, y, totalTableWidth, 42, 10)
      .fill("#faf8ff");

    doc
      .fillColor("#6b7280")
      .font("Helvetica")
      .fontSize(10.5)
      .text("No income records were found for the selected month.", left + 12, y + 14);
  } else {
    report.transactions.forEach((item, index) => {
      const bottomLimit = doc.page.height - doc.page.margins.bottom;

      if (y + 30 > bottomLimit) {
        doc.addPage();
        y = doc.page.margins.top;
        drawTableHeader(doc, left, widths, y);
        y += 32;
      }

      y += drawTransactionRow(doc, left, widths, y, item, index % 2 === 1);
    });
  }

  doc.end();
}

exports.downloadMonthlyIncomeReport = async (req, res) => {
  try {
    const month = parseRequestedMonth(req.query.month);

    if (!month) {
      return res.status(400).json({
        message: "Invalid month. Use YYYY-MM format.",
      });
    }

    const report = await buildIncomeReportData(month.key);
    renderIncomeReportPdf(res, report);
  } catch (err) {
    console.error("downloadMonthlyIncomeReport error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Failed to generate income report" });
    }
  }
};