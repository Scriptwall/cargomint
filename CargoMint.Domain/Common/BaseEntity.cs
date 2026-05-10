using System.ComponentModel.DataAnnotations;

namespace CargoMint.Domain.Common;

public abstract class BaseEntity : IAuditable
{
    public int Id { get; protected set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
    public bool IsDeleted { get; set; }

    [Timestamp]
    public byte[]? RowVersion { get; set; }
}
