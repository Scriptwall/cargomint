using CargoMint.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Country : BaseEntity
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(10)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? ShortCode { get; set; }

    [MaxLength(10)]
    public string? CurrencySymbol { get; set; }

    [MaxLength(10)]
    public string? CurrencyCode { get; set; }

    public decimal CurrencyRatio { get; set; }
    
    public bool IsActive { get; set; } = true;

    [MaxLength(10)]
    public string? DialCode { get; set; }

    [MaxLength(100)]
    public string? ContactNumber { get; set; }

    [MaxLength(100)]
    public string? ContactEmail { get; set; }

    [MaxLength(300)]
    public string? FlagUrl { get; set; }

    public bool IsInternational { get; set; }

    public ICollection<Region> Regions { get; set; } = new HashSet<Region>();
    public ICollection<State> States { get; set; } = new HashSet<State>();
}
