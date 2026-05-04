import { describe, it, expect } from "vitest";
import { parseLenient } from "@/lib/lenientJson";

describe("parseLenient", () => {
  it("parses valid JSON", () => {
    const r = parseLenient('{"a":1}');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ a: 1 });
  });

  it("handles Python None/True/False", () => {
    const r = parseLenient("{'x': None, 'y': True, 'z': False}");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toEqual({ x: null, y: true, z: false });
  });

  it("handles Python enum repr", () => {
    const r = parseLenient("{'type': <RunType.JOB_RUN: 'JOB_RUN'>}");
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.value as Record<string, unknown>).type).toBe("JOB_RUN");
  });

  it("handles Python object repr", () => {
    const r = parseLenient("{'state': RunState(life_cycle_state='TERMINATED', result_state='CANCELED')}");
    expect(r.ok).toBe(true);
    if (r.ok) {
      const state = (r.value as Record<string, unknown>).state as Record<string, unknown>;
      expect(state.life_cycle_state).toBe("TERMINATED");
      expect(state.result_state).toBe("CANCELED");
    }
  });

  it("handles nested Python object reprs", () => {
    const r = parseLenient(
      "{'status': RunStatus(state='TERMINATED', details=TerminationDetails(code='USER_CANCELED', type='SUCCESS'))}",
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      const status = (r.value as Record<string, unknown>).status as Record<string, unknown>;
      expect(status.state).toBe("TERMINATED");
      const details = status.details as Record<string, unknown>;
      expect(details.code).toBe("USER_CANCELED");
    }
  });

  it("handles full Databricks Python repr", () => {
    const input =
      "{'run_id': 123, 'run_type': <RunType.JOB_RUN: 'JOB_RUN'>, 'state': RunState(life_cycle_state=<RunLifeCycleState.TERMINATED: 'TERMINATED'>, queue_reason=None, result_state=<RunResultState.CANCELED: 'CANCELED'>, state_message='Run cancelled by user', user_cancelled_or_timedout=True), 'trigger_info': TriggerInfo(run_id=264328600444240)}";
    const r = parseLenient(input);
    expect(r.ok).toBe(true);
    if (r.ok) {
      const v = r.value as Record<string, unknown>;
      expect(v.run_type).toBe("JOB_RUN");
      const state = v.state as Record<string, unknown>;
      expect(state.life_cycle_state).toBe("TERMINATED");
      expect(state.queue_reason).toBeNull();
      expect(state.user_cancelled_or_timedout).toBe(true);
    }
  });
});
