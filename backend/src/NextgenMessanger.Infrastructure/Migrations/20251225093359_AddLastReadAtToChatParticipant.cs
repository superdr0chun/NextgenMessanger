using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NextgenMessanger.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLastReadAtToChatParticipant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LastReadAt",
                table: "ChatParticipants",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastReadAt",
                table: "ChatParticipants");
        }
    }
}
