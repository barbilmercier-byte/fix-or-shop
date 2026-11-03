import { finishRepair } from "./actions";

export function FinishForm({ id, path }: { id: string; path: "diy" | "shop" }) {
  return (
    <form action={finishRepair} className="card space-y-4">
      <h2 className="font-semibold">{path === "diy" ? "Finished?" : "Back from the shop?"}</h2>
      <div>
        <label className="label" htmlFor="amount_spent">
          {path === "diy" ? "What did you spend on parts and tools?" : "What did the shop charge?"}
        </label>
        <input id="amount_spent" name="amount_spent" inputMode="decimal" className="input" placeholder="0.00" />
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Notes <span className="font-normal muted">(optional)</span>
        </label>
        <textarea id="notes" name="notes" rows={2} className="input" placeholder="Part brand, where you bought it, what you'd do differently" />
      </div>
      <input type="hidden" name="id" value={id} />
      <div className="flex gap-2">
        <button name="status" value="fixed" className="btn-primary flex-1">
          It&apos;s fixed
        </button>
        <button name="status" value="not_fixed" className="btn-secondary flex-1">
          Not fixed
        </button>
      </div>
    </form>
  );
}
