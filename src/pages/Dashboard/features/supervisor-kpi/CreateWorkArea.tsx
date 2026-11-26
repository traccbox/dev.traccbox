import React, { useRef } from "react";
import { toast } from "sonner";
import CreateWorkAreaWizard from "@/pages/Dashboard/features/work-areas/CreateWorkAreaWizard";
import { toWorkLocation } from "@/api/supervisor-kpi/workAreas";
import type { WorkLocation } from "@/api/supervisor-kpi/types";
import { useWorkforce } from "./store";
import { useWorkAreas } from "./useWorkAreas";

/**
 * Opens the Work Areas create wizard and links whatever it creates to the
 * active workspace. Mount it only while creating.
 */
const CreateWorkArea: React.FC<{ onDone: (created: WorkLocation[]) => void }> = ({ onDone }) => {
  const { data, refetch } = useWorkAreas();
  const { linkLocations } = useWorkforce();
  // Ids that existed when the wizard opened; unknown if the list never loaded.
  const before = useRef(data ? new Set(data.areas.map((a) => a.id)) : null);

  const close = async () => {
    const res = await refetch();
    const known = before.current;
    const created = known ? (res.data?.areas ?? []).filter((a) => !known.has(a.id)).map(toWorkLocation) : [];
    if (created.length) {
      linkLocations(created);
      toast.success(`${created.map((c) => c.name).join(", ")} added to this workspace`);
    }
    onDone(created);
  };

  return <CreateWorkAreaWizard open onClose={close} />;
};

export default CreateWorkArea;
