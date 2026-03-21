package com.mytelco.customerbff.experiment;

import java.util.List;
import java.util.Map;

public record Experiment(
    String experimentId,
    String name,
    String description,
    String status,
    List<String> variants,
    Map<String, Double> trafficAllocation,
    Map<String, Map<String, Object>> config,
    String startDate,
    String endDate
) {}
