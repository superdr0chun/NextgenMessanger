using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ChatParticipantConfiguration : IEntityTypeConfiguration<ChatParticipant>
{
    public void Configure(EntityTypeBuilder<ChatParticipant> builder)
    {
        builder.HasKey(cp => cp.Id);

        var converter = new ValueConverter<ChatParticipantRole, string>(
            v => v.ToString().ToLowerInvariant(),
            v => Enum.Parse<ChatParticipantRole>(v, true));

        builder.Property(cp => cp.Role)
            .HasConversion(converter)
            .HasMaxLength(20)
            .HasDefaultValue(ChatParticipantRole.Member);

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

