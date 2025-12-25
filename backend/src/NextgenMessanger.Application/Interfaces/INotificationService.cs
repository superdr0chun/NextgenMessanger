using NextgenMessanger.Core.DTOs.Notification;

namespace NextgenMessanger.Application.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<NotificationDto>> GetNotificationsAsync(Guid userId, int page = 1, int pageSize = 20);
    Task<NotificationDto?> GetNotificationByIdAsync(Guid notificationId, Guid userId);
    Task MarkAsReadAsync(Guid notificationId, Guid userId);
    Task MarkAllAsReadAsync(Guid userId);
    Task<int> GetUnreadCountAsync(Guid userId);
    Task<int> GetUnreadCountByTypeAsync(Guid userId, string type);
    Task CreateNotificationAsync(Guid userId, string type, object? data = null);
}

