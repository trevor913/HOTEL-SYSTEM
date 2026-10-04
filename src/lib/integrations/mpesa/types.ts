export interface StkPushInput { phone: string; amountCents: number; reference: string; description: string }
export interface StkPushResult { ok: boolean; checkoutRequestId: string; customerMessage: string }
export interface MpesaAdapter { mode: "mock" | "live"; stkPush(p: StkPushInput): Promise<StkPushResult> }