import React, { useMemo } from "react";
import { Stack, Box, Typography } from "@mui/material";
import { mushStages, ChallengeStage, colorPalette } from "./types";
import { useSharedMushroomTries } from "./Provider";

const BOX_LENGTH = 48; // Fixed bucket height
const STRIPE_WIDTH = 4; // Left border width

interface BucketSegment {
  fraction: number; // 0-1
  color: string;
}

interface BucketWithSegments extends ChallengeStage {
  segments: BucketSegment[];
}

const MushStages = () => {
  const { days } = useSharedMushroomTries();
  const tasksPerDay = days.map((d) => d.tries.length + 3);

  // Repeat buckets until total tasks are covered
  const repeatedBuckets = useMemo<BucketWithSegments[]>(() => {
    const totalTasks = tasksPerDay.reduce((a, b) => a + b, 0);
    const bucketSum = mushStages.reduce((a, b) => a + b.tries, 0);
    const repeatCount = Math.ceil(totalTasks / bucketSum);

    const buckets: BucketWithSegments[] = [];

    for (let r = 0; r < repeatCount; r++) {
      mushStages.forEach((bucket) => {
        const [start, end] = bucket.stage.split("-").map(Number);
        buckets.push({
          ...bucket,
          stage: `${start + r * mushStages.length}-${end}`,
          segments: [],
        });
      });
    }

    return buckets;
  }, [tasksPerDay]);

  // Assign segments to each bucket based on tasks completed per day
  useMemo(() => {
    let currentBucketIndex = 0;
    let bucketRemaining = repeatedBuckets[0]?.tries ?? 0;

    tasksPerDay.forEach((tasksToday, dayIndex) => {
      let remainingTasks = tasksToday;
      const color = colorPalette[dayIndex % colorPalette.length];

      while (
        remainingTasks > 0 &&
        currentBucketIndex < repeatedBuckets.length
      ) {
        const currentBucket = repeatedBuckets[currentBucketIndex];

        const fill = Math.min(remainingTasks, bucketRemaining);
        const fraction = fill / currentBucket.tries;

        currentBucket.segments.push({ fraction, color });

        remainingTasks -= fill;
        bucketRemaining -= fill;

        if (bucketRemaining === 0) {
          currentBucketIndex++;
          if (currentBucketIndex < repeatedBuckets.length) {
            bucketRemaining = repeatedBuckets[currentBucketIndex].tries;
          }
        }
      }
    });
  }, [tasksPerDay, repeatedBuckets]);

  return (
    <Box
      display="flex"
      alignItems="stretch"
      sx={{
        height: "70vh",
        overflowY: "auto",
        outline: "1px solid",
        outlineColor: "divider",
        outlineOffset: -1,
        mt: 1,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      <Stack direction="column" spacing={0}>
        {repeatedBuckets.map((bucket, i) => (
          <Box
            key={i}
            sx={{
              position: "relative",
              width: BOX_LENGTH,
              height: BOX_LENGTH,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              lineHeight: 1,
              outline: i < repeatedBuckets.length - 1 ? "1px solid" : "none",
              outlineColor: "divider",
              boxSizing: "border-box",
            }}
          >
            <Typography variant="caption" color="text.disabled">
              {bucket.stage}
            </Typography>
            <Typography variant="body2" color="text.primary">
              {bucket.tries}
            </Typography>

            {/* Left stripe representing tasks completed per day */}
            {bucket.segments.map((seg, idx) => (
              <Box
                key={idx}
                sx={{
                  position: "absolute",
                  left: 0,
                  top: bucket.segments
                    .slice(0, idx)
                    .reduce((sum, s) => sum + s.fraction * BOX_LENGTH, 0),
                  width: STRIPE_WIDTH,
                  height: seg.fraction * BOX_LENGTH,
                  bgcolor: seg.color,
                }}
              />
            ))}
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default MushStages;
