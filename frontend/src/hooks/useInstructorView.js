import { useEffect, useState } from "react";
import { useAuth } from "../auth/useAuth";
import { listInstructorsApi } from "../api/adminApi";

const STORAGE_KEY = "admin_selected_instructor_id";

export default function useInstructorView() {
  const { role } = useAuth();
  const isAdminInstructorView = role === "ADMIN";

  const [instructors, setInstructors] = useState([]);
  const [selectedInstructorId, setSelectedInstructorIdState] = useState(
    () => localStorage.getItem(STORAGE_KEY) || ""
  );
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [selectorError, setSelectorError] = useState("");

  useEffect(() => {
    if (!isAdminInstructorView) {
      setInstructors([]);
      setLoadingInstructors(false);
      setSelectorError("");
      return;
    }

    let mounted = true;

    (async () => {
      setLoadingInstructors(true);
      setSelectorError("");

      try {
        const res = await listInstructorsApi();
        const list = Array.isArray(res.data) ? res.data : [];

        if (!mounted) return;

        setInstructors(list);

        const saved = localStorage.getItem(STORAGE_KEY) || "";
        const isSavedValid = list.some((x) => String(x.id) === String(saved));

        const nextValue = isSavedValid
          ? String(saved)
          : list[0]?.id
            ? String(list[0].id)
            : "";

        setSelectedInstructorIdState(nextValue);

        if (nextValue) localStorage.setItem(STORAGE_KEY, nextValue);
        else localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        if (!mounted) return;
        setInstructors([]);
        setSelectedInstructorIdState("");
        setSelectorError(
          e?.response?.data?.message || "Failed to load instructors"
        );
      } finally {
        if (mounted) setLoadingInstructors(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isAdminInstructorView]);

  const setSelectedInstructorId = (value) => {
    const next = String(value || "");
    setSelectedInstructorIdState(next);

    if (next) localStorage.setItem(STORAGE_KEY, next);
    else localStorage.removeItem(STORAGE_KEY);
  };

  const selectedInstructor =
    instructors.find((x) => String(x.id) === String(selectedInstructorId)) || null;

  return {
    role,
    isAdminInstructorView,
    instructors,
    selectedInstructorId,
    setSelectedInstructorId,
    selectedInstructor,
    loadingInstructors,
    selectorError,
  };
}