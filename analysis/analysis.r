library(tidyverse)
library(jsonlite)
library(FSA)

#options(error=traceback)

# README!!!
# 1. make sure to create the results folder

pdf(NULL) # prevent Rplots.pdf from generating

# custom palette (grafify fishy)
palette <- c('#6388b4','#ffae34','#ef6f6a','#8cc2ca','#c3bc3f','#55ad89','#bb7693','#baa094','#767676')

# read video data
videos <- read_json('videos.json') %>%
    tibble %>%
    unnest_wider(everything())

# read the database of user responses
database <- read_json('responses.json')

# additional user properties for demographic analysis
userProperties <- c(
    'age',
    'gender',
    'gaming',
    'modeling',
    'vr')

users <- database %>%
    enframe(name = 'sessionID') %>%
    unnest_wider(value) %>%
    select(sessionID, all_of(userProperties))

responses <- database %>%
    map(~ .x %>%
        enframe(name = 'videoID') %>%
        filter(!videoID %in% userProperties) %>%
        unnest_wider(value)) %>%
    bind_rows(.id = 'sessionID')

euclidean <- function(a, b) {
    a <- unlist(a)
    b <- unlist(b)
    sqrt(sum((a - b) ^ 2))
}

# Add calculated distances
processedVideos <- videos %>%
    mutate(distance2D = mapply(euclidean, pointA, pointB)) %>%
    mutate(distance3D = mapply(euclidean, positionA, positionB)) %>%
    mutate(distanceDepth = abs(depthA - depthB))

# Join videos and responses, calculate errors
processed <- responses %>%
    left_join(processedVideos, join_by(videoID == hash)) %>%
    left_join(users, join_by(sessionID)) %>%
    mutate(error = distance.x - distance.y) %>%
    mutate(errorsq = error * error) %>%
    mutate(abserror = abs(error)) %>%
    select(
        sessionID,
        videoID,
        volume,
        method,
        error,
        errorsq,
        abserror,
        distance2D,
        distance3D,
        distanceDepth,
        all_of(userProperties))

# Are there significant differences in MAD when grouping by method, filtered
# by volume? Because the volume differences could outpower the method differences.
processed %>%
    group_by(volume) %>%
    do(kruskal_test = kruskal.test(abserror ~ method, data = .)) %>%
    pull(kruskal_test)

# Is there bias of the error towards the middle?
processed %>%
    summarize(
        mean_error = mean(error),
        sd_error = sd(error),
        min_error = min(error),
        max_error = max(error)
    )

processed %>%
    group_by(sessionID) %>%
    summarize(
        mean_error = mean(error),
        sd_error = sd(error),
        min_error = min(error),
        max_error = max(error)
    )

processed %>%
    group_by(videoID) %>%
    summarize(
        mean_error = mean(error),
        sd_error = sd(error),
        min_error = min(error),
        max_error = max(error)
    )

processed %>%
    group_by(method) %>%
    summarize(
        mean_error = mean(error),
        sd_error = sd(error),
        min_error = min(error),
        max_error = max(error)
    )

processed %>%
    group_by(volume) %>%
    summarize(
        mean_error = mean(error),
        sd_error = sd(error),
        min_error = min(error),
        max_error = max(error)
    )

# make a boxplot of the correct distances
processedVideos %>%
    ggplot() +
        aes(x = '', y = distance) +
        geom_boxplot() +
        geom_jitter(width = 0.2)
ggsave('results/distance_boxplot.eps', width = 2, height = 7)

# make a boxplot of the 2D distances
processedVideos %>%
    ggplot() +
        aes(x = '', y = distance2D) +
        geom_boxplot() +
        geom_jitter(width = 0.2)
ggsave('results/distance2D_boxplot.eps', width = 2, height = 7)

# make a boxplot of the 3D distances
processedVideos %>%
    ggplot() +
        aes(x = '', y = distance3D) +
        geom_boxplot() +
        geom_jitter(width = 0.2)
ggsave('results/distance3D_boxplot.eps', width = 2, height = 7)

# make a boxplot of the depth distances
processedVideos %>%
    ggplot() +
        aes(x = '', y = distanceDepth) +
        geom_boxplot() +
        geom_jitter(width = 0.2)
ggsave('results/distanceDepth_boxplot.eps', width = 2, height = 7)

# put all boxplots in one image
processedVideos %>%
    mutate(distanceDepth = sqrt(distance3D * distance3D - distance2D * distance2D)) %>%
    gather(key = 'DistanceType', value = 'Distance', distance, distance2D, distance3D, distanceDepth) %>%
    ggplot() +
        aes(x = '', y = Distance, fill = DistanceType) +
        facet_grid(~ DistanceType, labeller = labeller(DistanceType = c(
            'distance' = 'Relative depth',
            'distance2D' = '2D distance',
            'distance3D' = '3D distance',
            'distanceDepth' = 'Depth difference'))) +
        geom_boxplot() +
        geom_jitter(width = 0.2) +
        guides(fill = 'none') +
        theme(axis.title.x = element_blank(), axis.title.y = element_blank()) +
        scale_fill_manual(values = palette) +
        scale_x_discrete(breaks = NULL)
ggsave('results/distances_boxplot.eps', height = 7)

# plot errors for each session
processed %>%
    ggplot() +
        aes(x = reorder(sessionID, abserror, FUN = median), y = abserror) +
        theme(axis.text.x = element_blank()) +
        geom_boxplot() +
        labs(x = 'Participant', y = 'MAD') +
        scale_fill_manual(values = palette) +
        scale_x_discrete(breaks = NULL)
ggsave('results/errors_session.eps', height = 7, width = 20)

# plot errors for each video
processed %>%
    ggplot() +
        aes(x = reorder(videoID, abserror, FUN = median), y = abserror, fill = volume) +
        geom_boxplot() +
        theme(axis.text.x = element_blank()) +
        guides(fill = 'none') +
        labs(x = 'Test case', y = 'MAD') +
        scale_fill_manual(values = palette) +
        scale_x_discrete(breaks = NULL)
ggsave('results/errors_video.eps', height = 7, width = 20)

# plot errors for each volume
processed %>%
    mutate(volume = reorder(volume, abserror, FUN = median)) %>%
    ggplot() +
        aes(x = volume, y = abserror, fill = volume) +
        facet_grid(~ volume, scales = 'free_x') +
        geom_boxplot() +
        theme(axis.text.x = element_blank(), axis.title.x = element_blank()) +
        guides(fill = 'none') +
        labs(y = 'MAD') +
        scale_fill_manual(values = palette) +
        scale_x_discrete(breaks = NULL)
ggsave('results/errors_volume.eps', height = 7)

# plot errors for each method
processed %>%
    mutate(method = reorder(method, abserror, FUN = median)) %>%
    ggplot() +
        aes(x = method, y = abserror, fill = method) +
        facet_grid(~ method, scales = 'free_x', labeller = labeller(method = c("iso" = "ISO", "eam" = "EAM", "dos" = "DOS", "mcm" = "VPT"))) +
        geom_boxplot() +
        theme(axis.text.x = element_blank(), axis.title.x = element_blank()) +
        guides(fill = 'none') +
        labs(y = 'MAD') +
        scale_fill_manual(values = palette) +
        scale_x_discrete(breaks = NULL)
ggsave('results/errors_method.eps', height = 7)

# plot errors wrt distance2D
processed %>%
    ggplot() +
        aes(x = distance2D, y = abserror) +
        geom_point() +
        geom_smooth(method = 'lm')
ggsave('results/errors_distance2D.eps', height = 7)
lm(abserror ~ distance2D, data = processed) %>% summary

# plot errors wrt distance3D
processed %>%
    ggplot() +
        aes(x = distance3D, y = abserror) +
        geom_point() +
        geom_smooth(method = 'lm')
ggsave('results/errors_distance3D.eps', height = 7)
lm(abserror ~ distance3D, data = processed) %>% summary

# plot errors wrt distanceDepth
processed %>%
    ggplot() +
        aes(x = distanceDepth, y = abserror) +
        geom_point() +
        geom_smooth(method = 'lm')
ggsave('results/errors_distanceDepth.eps', height = 7)
lm(abserror ~ distanceDepth, data = processed) %>% summary

# test normality of residuals
model <- lm(abserror ~ method, data = processed)
shapiro.test(residuals(model))
model <- lm(abserror ~ volume, data = processed)
shapiro.test(residuals(model))

# test homoscedasticity
bartlett.test(abserror ~ method, data = processed)
bartlett.test(abserror ~ volume, data = processed)

# above tests fail, use Kruskal-Wallis
kruskal.test(abserror ~ method, data = processed)
kruskal.test(abserror ~ volume, data = processed)

# Dunn's post-hoc test: see which ones differ
dunnTest(abserror ~ method, data = processed)
dunnTest(abserror ~ volume, data = processed)

# print MAD for each method
processed %>%
    group_by(method) %>%
    summarize(
        mad = median(abserror),
        sd = sd(abserror),
    )

# print MAD for each volume
processed %>%
    group_by(volume) %>%
    summarize(
        mad = median(abserror),
        sd = sd(abserror),
    )

# test for correlations with prior experience
kruskal.test(abserror ~ vr, data = processed)
kruskal.test(abserror ~ gaming, data = processed)
kruskal.test(abserror ~ modeling, data = processed)

# post-hoc
dunnTest(abserror ~ vr, data = processed)
dunnTest(abserror ~ gaming, data = processed)
dunnTest(abserror ~ modeling, data = processed)

# print MAD wrt user experience
processed %>%
    group_by(vr) %>%
    summarize(
        mad = median(abserror),
        sd = sd(abserror),
    )

processed %>%
    group_by(gaming) %>%
    summarize(
        mad = median(abserror),
        sd = sd(abserror),
    )

processed %>%
    group_by(modeling) %>%
    summarize(
        mad = median(abserror),
        sd = sd(abserror),
    )

# box and whisker plot of the above
processed %>%
    filter(!is.na(vr)) %>%
    filter(!is.na(gaming)) %>%
    filter(!is.na(modeling)) %>%
    gather(key = 'activity', value = 'likert', vr, gaming, modeling) %>%
    ggplot()

# is there a linear relationship between MAD and user experience
lm(abserror ~ vr, data = processed) %>% summary
lm(abserror ~ gaming, data = processed) %>% summary
lm(abserror ~ modeling, data = processed) %>% summary

# test for linear correlation between MAD and age
lm(abserror ~ age, data = processed) %>% summary

# demographic data
users %>%
    filter(!is.na(age)) %>%
    filter(!is.na(vr)) %>%
    filter(!is.na(gaming)) %>%
    filter(!is.na(modeling)) %>%
    summarize(
        mean_age = mean(age),
        sd_age = sd(age),
        mean_vr = mean(vr),
        sd_vr = sd(vr),
        mean_gaming = mean(gaming),
        sd_gaming = sd(gaming),
        mean_modeling = mean(modeling),
        sd_modeling = sd(modeling),
    )

# plot age histogram
users %>%
    filter(!is.na(age)) %>%
    ggplot() +
        aes(x = age) +
        geom_histogram(fill = palette[1], breaks = seq(10, 80, by = 10)) +
        scale_x_continuous(breaks = seq(0, 80, by = 20)) +
        scale_y_continuous(breaks = seq(0, 10, by = 5)) +
        labs(x = 'Age', y = 'Count')
ggsave('results/demographic_age.eps', width = 7, height = 2)

# plot vr experience histogram
users %>%
    filter(!is.na(vr)) %>%
    ggplot() +
        aes(x = vr) +
        geom_histogram(bins = 5)
ggsave('results/demographic_vr.eps', width = 7, height = 2)

# plot gaming experience histogram
users %>%
    filter(!is.na(gaming)) %>%
    ggplot() +
        aes(x = gaming) +
        geom_histogram(bins = 5)
ggsave('results/demographic_gaming.eps', width = 7, height = 2)

# plot modeling experience histogram
users %>%
    filter(!is.na(modeling)) %>%
    ggplot() +
        aes(x = modeling) +
        geom_histogram(bins = 5)
ggsave('results/demographic_modeling.eps', width = 7, height = 2)

# plot experience histograms in one figure
users %>%
    filter(!is.na(vr)) %>%
    filter(!is.na(gaming)) %>%
    filter(!is.na(modeling)) %>%
    gather(key = 'activity', value = 'likert', vr, gaming, modeling) %>%
    ggplot() +
        aes(x = likert, fill = activity) +
        geom_histogram(bins = 5) +
        facet_grid(activity ~ ., labeller = labeller(activity = c('vr' = 'VR', 'gaming' = 'Gaming', 'modeling' = 'Modeling'))) +
        guides(fill = 'none') +
        #scale_fill_brewer(palette = 'Set2') +
        scale_fill_manual(values = palette) +
        labs(x = 'Experience', y = 'Count')
ggsave('results/experience.eps', width = 7, height = 5)

# A boxplot of MAD w.r.t. vr/gaming/modeling experience
processed %>%
    gather(key = 'activity', value = 'likert', vr, gaming, modeling) %>%
    mutate(likert = as.factor(likert)) %>%
    drop_na() %>%
    ggplot() +
        aes(x = likert, y = abserror, fill = activity) +
        geom_boxplot() +
        facet_grid(activity ~ ., labeller = labeller(activity = c('vr' = 'VR', 'gaming' = 'Gaming', 'modeling' = 'Modeling'))) +
        guides(fill = 'none') +
        scale_fill_manual(values = palette) +
        labs(x = 'Experience', y = 'MAD')
ggsave('results/errors_experience.eps', width = 7, height = 5)
