using Newtonsoft.Json;
using Newtonsoft.Json.Converters;
using Newtonsoft.Json.Serialization;

namespace NzbDrone.Core.Notifications.Webhook
{
    // PascalCase enum serialization kept for backwards compatibility with existing webhook consumers
    [JsonConverter(typeof(StringEnumConverter), converterParameters: typeof(DefaultNamingStrategy))]
    public enum WebhookEventType
    {
        Test,
        Grab,
        Download,
        Rename,
        SeriesAdd,
        SeriesDelete,
        EpisodeFileDelete,
        Health,
        ApplicationUpdate,
        HealthRestored,
        ManualInteractionRequired
    }
}
