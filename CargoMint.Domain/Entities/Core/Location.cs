using CargoMint.Domain.Common;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class Region : BaseEntity
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? Code { get; set; }

    public int CountryId { get; set; }
    public Country? Country { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<State> States { get; set; } = new HashSet<State>();
}

public class State : BaseEntity
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? Code { get; set; }

    public int CountryId { get; set; }
    public Country? Country { get; set; }

    public int? RegionId { get; set; }
    public Region? Region { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<Station> Stations { get; set; } = new HashSet<Station>();
}

public class Station : BaseEntity
{
    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(10)]
    public string? Code { get; set; }

    public int StateId { get; set; }
    public State? State { get; set; }
    public bool IsActive { get; set; } = true;
}
