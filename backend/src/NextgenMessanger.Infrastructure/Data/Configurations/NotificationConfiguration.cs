using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using NextgenMessanger.Core.Entities;

namespace NextgenMessanger.Infrastructure.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Type)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(n => n.Data)
            .HasColumnType("jsonb");

        builder.Property(n => n.IsRead)
            .HasDefaultValue(false);

        builder.Property(n => n.CreatedAt)
            .HasDefaultValueSql("NOW()");

        builder.Property(n => n.UpdatedAt)
            .HasDefaultValueSql("NOW()");

        builder.HasIndex(n => n.UserId);

        builder.HasIndex(n => new { n.UserId, n.IsRead });

        builder.HasIndex(n => new { n.UserId, n.CreatedAt })
            .IsDescending();

        builder.HasIndex(n => n.Type);

        builder.HasIndex(n => new { n.UserId, n.IsRead, n.Deleted, n.CreatedAt })
            .IsDescending();

        builder.HasIndex(n => new { n.Deleted, n.DeletedAt });

        builder.HasOne(n => n.User)
            .WithMany(u => u.Notifications)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

