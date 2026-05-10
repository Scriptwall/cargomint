namespace CargoMint.Domain.Enums;

public enum TicketCategory
{
    ShipmentIssue,
    PickupIssue,
    DeliveryIssue,
    PaymentIssue,
    WalletIssue,
    PricingIssue,
    ManifestIssue,
    DriverAssignmentIssue,
    CustomerComplaint,
    TechnicalSystemIssue,
    AccountLoginIssue,
    GeneralQuestion
}

public enum TicketStatus
{
    Open,
    WaitingForTenantAdmin,
    WaitingForCustomer,
    WaitingForOperationsStaff,
    EscalatedToPlatformSupport,
    InProgress,
    Resolved,
    Closed
}

public enum TicketPriority
{
    Low,
    Medium,
    High,
    Critical
}

public enum EscalationLevel
{
    TenantInternal = 1,
    TenantAdminReview = 2,
    PlatformSupport = 3
}

public enum TicketCreatorRole
{
    Customer,
    OperationsStaff,
    TenantAdmin,
    PlatformAdmin
}
