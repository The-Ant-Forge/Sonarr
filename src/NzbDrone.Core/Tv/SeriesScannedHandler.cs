using System.Linq;
using NLog;
using NzbDrone.Core.Configuration;
using NzbDrone.Core.IndexerSearch;
using NzbDrone.Core.MediaFiles.Events;
using NzbDrone.Core.Messaging.Commands;
using NzbDrone.Core.Messaging.Events;
using NzbDrone.Core.Tv.Events;

namespace NzbDrone.Core.Tv
{
    public class SeriesScannedHandler : IHandle<SeriesScannedEvent>,
                                        IHandle<SeriesScanSkippedEvent>
    {
        private readonly IEpisodeMonitoredService _episodeMonitoredService;
        private readonly ISeriesService _seriesService;
        private readonly IEpisodeService _episodeService;
        private readonly IConfigService _configService;
        private readonly IManageCommandQueue _commandQueueManager;
        private readonly IEpisodeRefreshedService _episodeRefreshedService;
        private readonly IEventAggregator _eventAggregator;

        private readonly Logger _logger;

        public SeriesScannedHandler(IEpisodeMonitoredService episodeMonitoredService,
                                    ISeriesService seriesService,
                                    IEpisodeService episodeService,
                                    IConfigService configService,
                                    IManageCommandQueue commandQueueManager,
                                    IEpisodeRefreshedService episodeRefreshedService,
                                    IEventAggregator eventAggregator,
                                    Logger logger)
        {
            _episodeMonitoredService = episodeMonitoredService;
            _seriesService = seriesService;
            _episodeService = episodeService;
            _configService = configService;
            _commandQueueManager = commandQueueManager;
            _episodeRefreshedService = episodeRefreshedService;
            _eventAggregator = eventAggregator;
            _logger = logger;
        }

        private void HandleScanEvents(Series series)
        {
            var addOptions = series.AddOptions;

            if (addOptions == null)
            {
                _episodeRefreshedService.Search(series);

                // For existing series (not newly added), check if an ended series
                // is now complete and can be fully unmonitored.
                UnmonitorCompletedSeries(series);

                return;
            }

            _logger.Info("[{0}] was recently added, performing post-add actions", series.Title);
            _episodeMonitoredService.SetEpisodeMonitoredStatus(series, addOptions);

            // When UnmonitorOnDownload is enabled, unmonitor episodes that already
            // have files on disk. This prevents Sonarr from searching for and
            // potentially downloading inferior versions of episodes that are already
            // in the library (e.g. when Overseerr adds a show the user already has).
            if (_configService.UnmonitorOnDownload)
            {
                var episodes = _episodeService.GetEpisodeBySeries(series.Id);
                var withFiles = episodes.Where(e => e.HasFile && e.Monitored).ToList();

                if (withFiles.Any())
                {
                    _logger.Info("[{0}] Unmonitoring {1} episodes that already have files (UnmonitorOnDownload)", series.Title, withFiles.Count);

                    foreach (var episode in withFiles)
                    {
                        episode.Monitored = false;
                    }

                    _episodeService.UpdateEpisodes(withFiles);
                }
            }

            _eventAggregator.PublishEvent(new SeriesAddCompletedEvent(series));

            // If both options are enabled search for the whole series, which will only include monitored episodes.
            // This way multiple searches for the same season are skipped, though a season that can't be upgraded may be
            // searched, but the logs will be more explicit.

            if (addOptions.SearchForMissingEpisodes && addOptions.SearchForCutoffUnmetEpisodes)
            {
                _commandQueueManager.Push(new SeriesSearchCommand(series.Id));
            }
            else
            {
                if (addOptions.SearchForMissingEpisodes)
                {
                    _commandQueueManager.Push(new MissingEpisodeSearchCommand(series.Id));
                }

                if (addOptions.SearchForCutoffUnmetEpisodes)
                {
                    _commandQueueManager.Push(new CutoffUnmetEpisodeSearchCommand(series.Id));
                }
            }

            series.AddOptions = null;
            _seriesService.RemoveAddOptions(series);

            // After add options are processed, check if the series is already complete.
            UnmonitorCompletedSeries(series);
        }

        /// <summary>
        /// When UnmonitorOnDownload is enabled and a series has ended, check if all
        /// episodes in monitored seasons have files. If so, unmonitor the entire series
        /// to save processing power (no more refresh/search cycles for a complete show).
        /// Respects per-season monitoring: unmonitored seasons (e.g. specials) are excluded.
        /// </summary>
        private void UnmonitorCompletedSeries(Series series)
        {
            if (!_configService.UnmonitorOnDownload)
            {
                return;
            }

            if (series.Status != SeriesStatusType.Ended)
            {
                return;
            }

            if (!series.Monitored)
            {
                return;
            }

            var monitoredSeasonNumbers = series.Seasons
                .Where(s => s.Monitored)
                .Select(s => s.SeasonNumber)
                .ToHashSet();

            // No monitored seasons — nothing to check.
            if (!monitoredSeasonNumbers.Any())
            {
                return;
            }

            var episodes = _episodeService.GetEpisodeBySeries(series.Id);
            var episodesInMonitoredSeasons = episodes
                .Where(e => monitoredSeasonNumbers.Contains(e.SeasonNumber))
                .ToList();

            // Guard against empty episode lists (metadata not yet loaded).
            if (!episodesInMonitoredSeasons.Any())
            {
                return;
            }

            var allHaveFiles = episodesInMonitoredSeasons.All(e => e.HasFile);

            if (!allHaveFiles)
            {
                return;
            }

            _logger.Info(
                "[{0}] Series has ended and all {1} episodes in monitored seasons have files — unmonitoring series",
                series.Title,
                episodesInMonitoredSeasons.Count);

            // Unmonitor all episodes that are still monitored.
            var stillMonitored = episodes.Where(e => e.Monitored).ToList();

            if (stillMonitored.Any())
            {
                foreach (var episode in stillMonitored)
                {
                    episode.Monitored = false;
                }

                _episodeService.UpdateEpisodes(stillMonitored);
            }

            // Unmonitor the series itself.
            series.Monitored = false;
            _seriesService.UpdateSeries(series, false);
        }

        public void Handle(SeriesScannedEvent message)
        {
            HandleScanEvents(message.Series);
        }

        public void Handle(SeriesScanSkippedEvent message)
        {
            HandleScanEvents(message.Series);
        }
    }
}
