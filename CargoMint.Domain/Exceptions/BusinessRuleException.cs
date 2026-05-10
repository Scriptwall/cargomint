using System;

namespace CargoMint.Domain.Exceptions;

/// <summary>
/// Represents a violation of a business rule that should be reported to the user as a 422/400 error rather than a generic 500.
/// </summary>
public class BusinessRuleException : Exception
{
    public BusinessRuleException(string message) : base(message)
    {
    }

    public BusinessRuleException(string message, Exception innerException) : base(message, innerException)
    {
    }
}
