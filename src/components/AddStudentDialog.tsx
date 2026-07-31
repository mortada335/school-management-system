import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { addDocument } from "@/lib/firestore-helpers";
import type { Class, Student } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const emptyForm = () => ({
  name: "", // Arabic name
  nameEn: "", // English name
  classId: "",
  className: "", // Will be derived from classId
  gender: "male" as "male" | "female",
  dateOfBirth: "",
  guardianName: "",
  guardianPhone: "",
  enrollmentYear: "", // Will be set from activeYear
});

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  activeYear: string;
  classes: Class[];
}

export default function AddStudentDialog({ open, onClose, onAdded, activeYear, classes }: Props) {
  const { schoolId } = useAuth();
  const [form, setForm] = useState(() => ({ ...emptyForm(), enrollmentYear: activeYear }));
  const [saving, setSaving] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({ ...emptyForm(), enrollmentYear: activeYear });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !form.name || !form.classId) return;
    setSaving(true);

    const selectedClass = classes.find((c) => c.id === form.classId);
    const dataToSave = {
      ...form,
      className: selectedClass?.name ?? "",
      enrollmentYear: activeYear,
    };

    try {
      await addDocument(schoolId, "students", dataToSave as Omit<Student, "id" | "createdAt" | "schoolId">);
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gray-900 text-white sm:max-w-lg">
          <form onSubmit={handleSubmit}>
          <DialogTitle>Add Student</DialogTitle>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <select
                id="gender"
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value as "male" | "female" })}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <Label htmlFor="dob">Date of Birth</Label>
              <Input id="dob" type="date" value={form.dateOfBirth}
                onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
            </div>
          <div>
            <Label htmlFor="guardianName">Guardian Name</Label>
            <Input id="guardianName" value={form.guardianName}
              onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input id="guardianPhone" value={form.guardianPhone}
              onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Student"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}