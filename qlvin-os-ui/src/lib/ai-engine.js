export function getAIInsight(propertyData) {
  const insights = [
    {
      text: "Unit A3 likely to be rented within 5 days based on current demand trends in the area.",
      confidence: 82,
      type: "trend",
    },
    {
      text: "Revenue forecast for Q3 shows 14% growth if current occupancy holds.",
      confidence: 78,
      type: "insight",
    },
    {
      text: "3 leases expiring within 30 days — recommend early renewal outreach.",
      confidence: 95,
      type: "alert",
    },
  ];

  if (!propertyData) return insights[0];

  if (propertyData.status === "Vacant") {
    return {
      text: `${propertyData.name} has been vacant for an extended period. Suggested rent adjustment: -5% to accelerate occupancy.`,
      confidence: 74,
      type: "alert",
    };
  }

  return insights[Math.floor(Math.random() * insights.length)];
}

export function getRiskScore(portfolio) {
  const vacancyRate = portfolio?.vacancyRate ?? 0.1;
  if (vacancyRate < 0.05) return { score: "Low", color: "success" };
  if (vacancyRate < 0.15) return { score: "Medium", color: "warning" };
  return { score: "High", color: "danger" };
}
