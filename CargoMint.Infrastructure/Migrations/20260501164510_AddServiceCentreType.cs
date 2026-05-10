using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCentreType : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "ServiceCentres",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Type",
                table: "ServiceCentres");
        }
    }
}
