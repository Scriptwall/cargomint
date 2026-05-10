using CargoMint.Domain.Common;
using CargoMint.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Entities.Core;

public class ApplicationUser : IdentityUser<int>, IMustHaveTenant
{
    public int TenantId { get; set; }
    [Required, MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    public Gender Gender { get; set; } = Gender.Unknown;
    
    [MaxLength(100)]
    public string? Designation { get; set; }

    [MaxLength(100)]
    public string? Department { get; set; }

    public bool IsActive { get; set; } = true;

    public UserType UserType { get; set; } = UserType.Regular;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastModifiedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool IsDeleted { get; set; }
    
    public int? UserActiveCountryId { get; set; }

    /// <summary>
    /// Null for global roles (TenantAdmin, HubManager). Set for scoped roles (DeskOperator, ServiceCentreAdmin).
    /// Drives query-level filtering so scoped users only see their assigned service centre's data.
    /// </summary>
    public int? AssignedServiceCentreId { get; set; }

    /// <summary>
    /// When true, the user's login is blocked. Set by a ServiceCentreAdmin or TenantAdmin
    /// without fully deactivating the account.
    /// </summary>
    public bool IsLoginRestricted { get; set; }

    // Navigation properties for convenience
    public string FullName => $"{FirstName} {LastName}";
}

public class ApplicationRole : IdentityRole<int>
{
    public ApplicationRole() : base() { }
    public ApplicationRole(string roleName) : base(roleName) { }
}

