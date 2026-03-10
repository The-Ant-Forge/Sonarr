using System.Text;
using NLog;
using NLog.Layouts;
using NzbDrone.Common.EnvironmentInfo;

namespace NzbDrone.Common.Instrumentation;

// NLog 6 sealed SimpleLayout, so we derive from Layout and delegate to a
// SimpleLayout instance instead.
public class CleansingConsoleLogLayout : Layout
{
    private readonly SimpleLayout _inner;

    public CleansingConsoleLogLayout(string format)
    {
        _inner = format;
    }

    protected override string GetFormattedMessage(LogEventInfo logEvent)
    {
        var message = _inner.Render(logEvent);

        if (RuntimeInfo.IsProduction)
        {
            return CleanseLogMessage.Cleanse(message);
        }

        return message;
    }

    protected override void RenderFormattedMessage(LogEventInfo logEvent, StringBuilder target)
    {
        target.Append(_inner.Render(logEvent));

        if (RuntimeInfo.IsProduction)
        {
            var result = CleanseLogMessage.Cleanse(target.ToString());
            target.Clear();
            target.Append(result);
        }
    }
}
