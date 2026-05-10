using CargoMint.Application.Features.Core.Support;
using FluentValidation;

namespace CargoMint.Application.Validators;

public class CreateTicketValidator : AbstractValidator<CreateTicketCommand>
{
    public CreateTicketValidator()
    {
        RuleFor(x => x.Subject).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
        RuleFor(x => x.Category).NotEmpty();
        RuleFor(x => x.Priority).Must(p => string.IsNullOrEmpty(p) || IsValidPriority(p)).WithMessage("Invalid priority level.");
    }

    private static bool IsValidPriority(string priority) =>
        priority.Equals("Low", System.StringComparison.OrdinalIgnoreCase) ||
        priority.Equals("Medium", System.StringComparison.OrdinalIgnoreCase) ||
        priority.Equals("High", System.StringComparison.OrdinalIgnoreCase) ||
        priority.Equals("Critical", System.StringComparison.OrdinalIgnoreCase);
}

public class SendMessageValidator : AbstractValidator<SendMessageCommand>
{
    public SendMessageValidator()
    {
        RuleFor(x => x.TicketId).GreaterThan(0);
        RuleFor(x => x.Body).NotEmpty().MaximumLength(4000);
    }
}

