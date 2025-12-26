using NextgenMessanger.Core.DTOs.Chat;

namespace NextgenMessanger.Application.Interfaces;

public interface IChatService
{
    Task<ChatDto> CreateChatAsync(Guid userId, CreateChatDto createDto);
    Task<IEnumerable<ChatDto>> GetUserChatsAsync(Guid userId);
    Task<ChatDto?> GetChatByIdAsync(Guid chatId, Guid userId);
    Task<ChatDto> UpdateChatAsync(Guid chatId, Guid userId, UpdateChatDto updateDto);
    Task AddParticipantAsync(Guid chatId, Guid userId, Guid participantId);
    Task RemoveParticipantAsync(Guid chatId, Guid userId, Guid participantId);
    Task MarkChatAsReadAsync(Guid chatId, Guid userId);
    Task DeleteChatAsync(Guid chatId, Guid userId, bool forEveryone = false);
}

