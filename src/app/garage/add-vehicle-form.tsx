"use client";

import { useActionState, useState } from "react";
import { addVehicle, type AddVehicleState } from "./actions";

export function AddVehicleForm({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);
  const [state, action, pending] = useActionState<AddVehicleState, FormData>(addVehicle, {});

  if (!open) {
    return (
      <button className="btn-secondary w-full" onClick={() => setOpen(true)}>
        + Add a car
      </button>
    );
  }

  return (
    <form action={action} className="card space-y-4">
      <h2 className="font-semibold">Add a car</h2>
      <div>
        <label className="label" htmlFor="vin">
          VIN <span className="font-normal muted">(fastest, on the driver&apos;s door frame or windshield)</span>
        </label>
        <input id="vin" name="vin" className="input uppercase" maxLength={17} placeholder="17 characters" />
      </div>
      <p className="text-xs muted">No VIN handy? Fill these in instead:</p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label" htmlFor="year">Year</label>
          <input id="year" name="year" inputMode="numeric" className="input" placeholder="2016" />
        </div>
        <div>
          <label className="label" htmlFor="make">Make</label>
          <input id="make" name="make" className="input" placeholder="Toyota" />
        </div>
        <div>
          <label className="label" htmlFor="model">Model</label>
          <input id="model" name="model" className="input" placeholder="Corolla" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="nickname">Nickname <span className="font-normal muted">(optional)</span></label>
          <input id="nickname" name="nickname" className="input" placeholder="Blue car" />
        </div>
        <div>
          <label className="label" htmlFor="mileage">Mileage <span className="font-normal muted">(optional)</span></label>
          <input id="mileage" name="mileage" inputMode="numeric" className="input" placeholder="84000" />
        </div>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        {pending ? "Saving…" : "Save car"}
      </button>
    </form>
  );
}
