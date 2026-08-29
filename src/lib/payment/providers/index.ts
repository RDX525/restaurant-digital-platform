import type { PaymentProvider } from "../types";
import { DemoPaymentProvider } from "./demo";
import { StripePaymentProvider } from "./stripe";
import { getPaymentProviderName } from "../config";

let demoProvider: DemoPaymentProvider | null = null;
let stripeProvider: StripePaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  const name = getPaymentProviderName();

  switch (name) {
    case "demo":
      demoProvider ??= new DemoPaymentProvider();
      return demoProvider;
    case "stripe":
      stripeProvider ??= new StripePaymentProvider();
      return stripeProvider;
    default:
      throw new Error(`Unsupported payment provider: ${name}`);
  }
}

export function getDemoPaymentProvider(): DemoPaymentProvider {
  const provider = getPaymentProvider();
  if (!(provider instanceof DemoPaymentProvider)) {
    throw new Error("Demo payment provider is not active");
  }
  return provider;
}
