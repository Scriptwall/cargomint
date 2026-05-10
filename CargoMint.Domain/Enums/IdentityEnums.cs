namespace CargoMint.Domain.Enums;

public enum UserType
{
    Regular,
    IndividualCustomer,
    CorporateCustomer,
    Ecommerce,
    Partner,
    SystemUser
}

public enum Gender
{
    Male,
    Female,
    Unknown
}

public enum TenantOperationalType
{
    Logistics = 1,
    Fleet = 2
}
