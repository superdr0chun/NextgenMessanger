using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ChatConfiguration : IEntityTypeConfiguration<Chat>
{
    public void Configure(EntityTypeBuilder<Chat> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Type)
            .HasMaxLength(20)
            .HasDefaultValue("direct");

        builder.Property(c => c.Title)
            .HasMaxLength(100);

        builder.Property(c => c.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(c => c.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(c => c.Type);

        builder.HasIndex(c => c.CreatedBy);

        builder.HasIndex(c => c.LastMessageAt)
            .IsDescending();

        builder.HasIndex(c => c.UpdatedAt)
            .IsDescending();

        builder.HasIndex(c => new { c.Deleted, c.DeletedAt });

        builder.HasOne(c => c.Creator)
            .WithMany(u => u.CreatedChats)
            .HasForeignKey(c => c.CreatedBy)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(c => c.LastMessage)
            .WithMany()
            .HasForeignKey(c => c.LastMessageId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}

