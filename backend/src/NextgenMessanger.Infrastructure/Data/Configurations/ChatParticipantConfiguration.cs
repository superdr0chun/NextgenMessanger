using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ChatParticipantConfiguration : IEntityTypeConfiguration<ChatParticipant>
{
    public void Configure(EntityTypeBuilder<ChatParticipant> builder)
    {
        builder.HasKey(cp => cp.Id);

        builder.Property(cp => cp.Role)
            .HasMaxLength(20)
            .HasDefaultValue("member");

        builder.Property(cp => cp.JoinedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(cp => cp.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(cp => cp.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(cp => cp.ChatId);

        builder.HasIndex(cp => cp.UserId);

        builder.HasIndex(cp => new { cp.ChatId, cp.UserId })
            .IsUnique();

        builder.HasIndex(cp => new { cp.ChatId, cp.LeftAt, cp.Deleted });

        builder.HasIndex(cp => new { cp.UserId, cp.ChatId, cp.Deleted });

        builder.HasIndex(cp => new { cp.Deleted, cp.DeletedAt });

        builder.HasOne(cp => cp.Chat)
            .WithMany(c => c.Participants)
            .HasForeignKey(cp => cp.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cp => cp.User)
            .WithMany(u => u.ChatParticipants)
            .HasForeignKey(cp => cp.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

