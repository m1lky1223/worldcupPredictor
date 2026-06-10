import { gql, useQuery } from "@apollo/client";
import {
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Stack,
  Typography,
  Skeleton,
} from "@mui/material";

const MODEL_METRICS_QUERY = gql`
  query ModelMetrics {
    modelMetrics {
      accuracy
      brierScore
      logLoss
      calibration
      modelVersion
      calculatedAt
    }
  }
`;

function MetricCard({
  title,
  value,
  format,
  color,
}: {
  title: string;
  value: number;
  format?: "percent" | "decimal";
  color?: string;
}) {
  const displayVal =
    format === "percent" ? `${(value * 100).toFixed(1)}%` : value.toFixed(4);
  const barValue = format === "percent" ? value : Math.min(value / 2, 1);

  return (
    <Card>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Typography
          variant="h3"
          fontWeight={700}
          color={color ?? "primary.main"}
        >
          {displayVal}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={barValue * 100}
          sx={{
            mt: 1,
            height: 8,
            borderRadius: 1,
            bgcolor: "action.hover",
            "& .MuiLinearProgress-bar": {
              bgcolor: color ?? "primary.main",
            },
          }}
        />
      </CardContent>
    </Card>
  );
}

export default function ModelTracker() {
  const { loading, error, data } = useQuery(MODEL_METRICS_QUERY);

  if (loading) {
    return (
      <Grid container spacing={3}>
        {[1, 2, 3].map((i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Skeleton variant="rounded" height={150} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) {
    return (
      <Typography color="error">
        Failed to load model metrics: {error.message}
      </Typography>
    );
  }

  const metrics = data?.modelMetrics;
  if (!metrics) {
    return (
      <Typography color="text.secondary">
        No model metrics available yet. Metrics will appear after matches have been played and evaluated.
      </Typography>
    );
  }

  const calibrationData = metrics.calibration;
  const calibrationEntries =
    calibrationData && typeof calibrationData === "object" && !Array.isArray(calibrationData)
      ? Object.entries(calibrationData as Record<string, number>)
      : [];

  return (
    <Stack spacing={3}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Typography variant="h5" fontWeight={700}>
          Model Performance
        </Typography>
        <Stack direction="row" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Version: {metrics.modelVersion}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            &middot; Updated:{" "}
            {new Date(metrics.calculatedAt).toLocaleDateString()}
          </Typography>
        </Stack>
      </Stack>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Accuracy"
            value={metrics.accuracy}
            format="percent"
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Brier Score"
            value={metrics.brierScore}
            format="decimal"
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <MetricCard
            title="Log Loss"
            value={metrics.logLoss}
            format="decimal"
            color="#f44336"
          />
        </Grid>
      </Grid>

      {calibrationEntries.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Calibration
            </Typography>
            <Stack spacing={1.5}>
              {calibrationEntries
                .sort(([a]: [string, number], [b]: [string, number]) => {
                  const aNum = parseFloat(a);
                  const bNum = parseFloat(b);
                  return aNum - bNum;
                })
                .map(([bin, value]: [string, number]) => (
                  <Stack key={bin} spacing={0.5}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2">{bin}</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {(value * 100).toFixed(0)}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={value * 100}
                      sx={{
                        height: 8,
                        borderRadius: 1,
                        bgcolor: "action.hover",
                        "& .MuiLinearProgress-bar": {
                          bgcolor: "primary.main",
                        },
                      }}
                    />
                  </Stack>
                ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {metrics.modelVersion && (
        <Typography variant="caption" color="text.secondary">
          Model version: {metrics.modelVersion} &middot; Last calculated:{" "}
          {new Date(metrics.calculatedAt).toLocaleString()}
        </Typography>
      )}
    </Stack>
  );
}
