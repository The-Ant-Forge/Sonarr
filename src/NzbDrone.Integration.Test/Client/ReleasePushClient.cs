using RestSharp;
using Sonarr.Api.V3.Indexers;

namespace NzbDrone.Integration.Test.Client
{
    public class ReleasePushClient : ClientBase<ReleaseResource>
    {
        public ReleasePushClient(RestClient restClient, string apiKey)
            : base(restClient, apiKey, "release/push")
        {
        }
    }
}
