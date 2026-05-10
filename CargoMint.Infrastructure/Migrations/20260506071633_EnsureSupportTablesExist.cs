using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CargoMint.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class EnsureSupportTablesExist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[dbo].[SupportTickets]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[SupportTickets](
                        [Id] [int] IDENTITY(1,1) NOT NULL,
                        [TenantId] [int] NOT NULL,
                        [TicketNumber] [nvarchar](20) NOT NULL,
                        [Subject] [nvarchar](200) NOT NULL,
                        [Description] [nvarchar](2000) NOT NULL,
                        [Category] [int] NOT NULL,
                        [Priority] [int] NOT NULL,
                        [Status] [int] NOT NULL,
                        [EscalationLevel] [int] NOT NULL,
                        [CreatorRole] [int] NOT NULL,
                        [CreatedByUserId] [nvarchar](450) NOT NULL,
                        [CreatedByUserName] [nvarchar](200) NULL,
                        [CreatedByUserEmail] [nvarchar](200) NULL,
                        [AssignedToUserId] [nvarchar](450) NULL,
                        [AssignedToUserName] [nvarchar](200) NULL,
                        [RelatedShipmentId] [int] NULL,
                        [RelatedWaybill] [nvarchar](100) NULL,
                        [RelatedServiceCentreId] [int] NULL,
                        [RelatedCustomerId] [nvarchar](450) NULL,
                        [LastMessagePreview] [nvarchar](200) NULL,
                        [LastActivityAtUtc] [datetime2] NULL,
                        [ClosedAtUtc] [datetime2] NULL,
                        [ClosedByUserId] [nvarchar](450) NULL,
                        [CreatedAt] [datetime2] NOT NULL,
                        [CreatedBy] [nvarchar](max) NULL,
                        [LastModifiedAt] [datetime2] NULL,
                        [LastModifiedBy] [nvarchar](max) NULL,
                        [IsDeleted] [bit] NOT NULL,
                        [RowVersion] [rowversion] NULL,
                        CONSTRAINT [PK_SupportTickets] PRIMARY KEY CLUSTERED ([Id] ASC)
                    );

                    CREATE UNIQUE INDEX [IX_SupportTickets_TenantId_TicketNumber] ON [dbo].[SupportTickets]([TenantId],[TicketNumber]);
                    CREATE INDEX [IX_SupportTickets_TenantId_Status] ON [dbo].[SupportTickets]([TenantId],[Status]);
                    CREATE INDEX [IX_SupportTickets_TenantId_EscalationLevel] ON [dbo].[SupportTickets]([TenantId],[EscalationLevel]);
                    CREATE INDEX [IX_SupportTickets_CreatedByUserId] ON [dbo].[SupportTickets]([CreatedByUserId]);
                    CREATE INDEX [IX_SupportTickets_AssignedToUserId] ON [dbo].[SupportTickets]([AssignedToUserId]);
                    CREATE INDEX [IX_SupportTickets_RelatedWaybill] ON [dbo].[SupportTickets]([RelatedWaybill]);
                END
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[dbo].[TicketMessages]', N'U') IS NULL
                BEGIN
                    CREATE TABLE [dbo].[TicketMessages](
                        [Id] [int] IDENTITY(1,1) NOT NULL,
                        [SupportTicketId] [int] NOT NULL,
                        [SenderUserId] [nvarchar](450) NOT NULL,
                        [SenderUserName] [nvarchar](200) NULL,
                        [SenderRole] [int] NOT NULL,
                        [Body] [nvarchar](4000) NOT NULL,
                        [AttachmentUrl] [nvarchar](1000) NULL,
                        [IsInternalNote] [bit] NOT NULL,
                        [IsRead] [bit] NOT NULL,
                        [CreatedAt] [datetime2] NOT NULL,
                        [CreatedBy] [nvarchar](max) NULL,
                        [LastModifiedAt] [datetime2] NULL,
                        [LastModifiedBy] [nvarchar](max) NULL,
                        [IsDeleted] [bit] NOT NULL,
                        [RowVersion] [rowversion] NULL,
                        CONSTRAINT [PK_TicketMessages] PRIMARY KEY CLUSTERED ([Id] ASC),
                        CONSTRAINT [FK_TicketMessages_SupportTickets_SupportTicketId] FOREIGN KEY([SupportTicketId]) REFERENCES [dbo].[SupportTickets] ([Id]) ON DELETE CASCADE
                    );

                    CREATE INDEX [IX_TicketMessages_SupportTicketId] ON [dbo].[TicketMessages]([SupportTicketId]);
                    CREATE INDEX [IX_TicketMessages_SenderUserId] ON [dbo].[TicketMessages]([SenderUserId]);
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[dbo].[TicketMessages]', N'U') IS NOT NULL
                    DROP TABLE [dbo].[TicketMessages];
                """);

            migrationBuilder.Sql(
                """
                IF OBJECT_ID(N'[dbo].[SupportTickets]', N'U') IS NOT NULL
                    DROP TABLE [dbo].[SupportTickets];
                """);
        }
    }
}
