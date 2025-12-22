using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NextgenMessanger.Application.Interfaces;
using NextgenMessanger.Core.DTOs.Notification;
using NextgenMessanger.Infrastructure.Data;

namespace NextgenMessanger.Application.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;

    public NotificationService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<NotificationDto>> GetNotificationsAsync(Guid userId, int page = 1, int pageSize = 20)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.Deleted)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return notifications.Select(n => new NotificationDto
        {
            Id = n.Id,
            UserId = n.UserId,
            Type = n.Type,
            Data = n.Data,
            IsRead = n.IsRead,
            CreatedAt = n.CreatedAt,
            UpdatedAt = n.UpdatedAt
        });
    }

    public async Task<NotificationDto?> GetNotificationByIdAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId && !n.Deleted);

        if (notification == null)
        {
            return null;
        }

        return new NotificationDto
        {
            Id = notification.Id,
            UserId = notification.UserId,
            Type = notification.Type,
            Data = notification.Data,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            UpdatedAt = notification.UpdatedAt
        };
    }

    public async Task MarkAsReadAsync(Guid notificationId, Guid userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId && !n.Deleted);

        if (notification == null)
        {
            throw new KeyNotFoundException("Notification not found");
        }

        notification.IsRead = true;
        notification.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.Deleted && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
    }

    public async Task<int> GetUnreadCountAsync(Guid userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.Deleted && !n.IsRead);
    }

    public async Task CreateNotificationAsync(Guid userId, string type, object? data = null)
    {
        var notification = new Core.Entities.Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Data = data != null ? JsonSerializer.Serialize(data) : null,
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            Deleted = false
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
    }
}

