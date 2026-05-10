using CargoMint.Application.Features.Core.Shipments;
using FluentValidation;

namespace CargoMint.Application.Validators;

public class CreateShipmentValidator : AbstractValidator<CreateShipmentCommand>
{
    public CreateShipmentValidator()
    {
        RuleFor(x => x.CustomerCode).NotEmpty();
        RuleFor(x => x.ReceiverName).NotEmpty().MaximumLength(200);
        RuleFor(x => x.ReceiverPhoneNumber).NotEmpty().MinimumLength(10);
        RuleFor(x => x.ReceiverAddress).NotEmpty().MaximumLength(500);
        RuleFor(x => x.DepartureStationId).GreaterThan(0);
        RuleFor(x => x.DestinationStationId).GreaterThan(0);
        
        RuleFor(x => x.Items).NotEmpty().WithMessage("At least one shipment item is required.");
        
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.Description).NotEmpty().MaximumLength(200);
            item.RuleFor(i => i.Quantity).GreaterThan(0);
            item.RuleFor(i => i.Price).GreaterThanOrEqualTo(0);
            item.RuleFor(i => i.Weight).GreaterThan(0);
        });
    }
}

