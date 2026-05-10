using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFleetMissingColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Ownership",
                table: "Fleets",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ServiceCentreId",
                table: "Fleets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TenantRolePermissions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    TenantId = table.Column<int>(type: "int", nullable: false),
                    RoleName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    PermissionKey = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    IsEnabled = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    LastModifiedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LastModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    RowVersion = table.Column<byte[]>(type: "rowversion", rowVersion: true, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantRolePermissions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Fleets_ServiceCentreId",
                table: "Fleets",
                column: "ServiceCentreId");

            migrationBuilder.AddForeignKey(
                name: "FK_Fleets_ServiceCentres_ServiceCentreId",
                table: "Fleets",
                column: "ServiceCentreId",
                principalTable: "ServiceCentres",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Fleets_ServiceCentres_ServiceCentreId",
                table: "Fleets");

            migrationBuilder.DropTable(
                name: "TenantRolePermissions");

            migrationBuilder.DropIndex(
                name: "IX_Fleets_ServiceCentreId",
                table: "Fleets");

            migrationBuilder.DropColumn(
                name: "Ownership",
                table: "Fleets");

            migrationBuilder.DropColumn(
                name: "ServiceCentreId",
                table: "Fleets");
        }
    }
}
