namespace CargoMint.Domain.Enums;

public enum CreditDebitType
{
    Credit = 1,
    Debit = 2
}

public enum PaymentType
{
    Cash,
    POS,
    Transfer,
    Online,
    Wallet,
    Paystack,
    Flutterwave
}

public enum CustomerType
{
    Individual,
    Company
}
