namespace CargoMint.Domain.Enums;

public enum BillingCycle
{
    Monthly = 1,
    Quarterly = 2,
    Yearly = 3
}

public enum SubscriptionStatus
{
    Trialing = 1,
    Active = 2,
    PastDue = 3,
    SuspendedBilling = 4,
    Canceled = 5,
    Paused = 6
}

public enum SubscriptionInvoiceStatus
{
    Draft = 1,
    Issued = 2,
    Paid = 3,
    Failed = 4,
    Voided = 5
}

public enum SubscriptionInvoiceLineType
{
    BasePlanFee = 1,
    PerShipmentFee = 2,
    Surcharge = 3,
    Discount = 4,
    Tax = 5,
    Credit = 6
}
