using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using NextgenMessanger.Core.Entities;
using NextgenMessanger.Core.Enums;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class ChatConfiguration : IEntityTypeConfiguration<Chat>
{
    public void Configure(EntityTypeBuilder<Chat> builder)
    {
        builder.HasKey(c => c.Id);

        var converter = new ValueConverter<ChatType, string>(
            v => v.ToString().ToLowerInvariant(),
            v => Enum.Parse<ChatType>(v, true));

        builder.Property(c => c.Type)
            .HasConversion(converter)
            .HasMaxLength(20)
            .HasDefaultValue(ChatType.Direct);

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

