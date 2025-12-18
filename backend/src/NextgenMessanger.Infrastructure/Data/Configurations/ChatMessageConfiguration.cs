using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.HasKey(cm => cm.Id);

        builder.Property(cm => cm.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(cm => cm.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(cm => cm.MediaUrl)
            .HasColumnType("text[]");

        builder.HasIndex(cm => cm.ChatId);

        builder.HasIndex(cm => cm.SenderId);

        builder.HasIndex(cm => new { cm.ChatId, cm.CreatedAt })
            .IsDescending();

        builder.HasIndex(cm => new { cm.Deleted, cm.DeletedAt });

        builder.HasOne(cm => cm.Chat)
            .WithMany(c => c.Messages)
            .HasForeignKey(cm => cm.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(cm => cm.Sender)
            .WithMany(u => u.ChatMessages)
            .HasForeignKey(cm => cm.SenderId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

