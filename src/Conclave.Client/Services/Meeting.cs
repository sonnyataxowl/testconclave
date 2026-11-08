namespace Conclave.Client.Services;

public sealed record Meeting(Guid Id, string Title, DateTimeOffset CreatedAt);
