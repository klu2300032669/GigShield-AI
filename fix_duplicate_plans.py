import os
import re

filepath = r'c:\Users\DELL\OneDrive\Desktop\PROJECT 2327\gigshield-backend\src\main\java\com\gigshield\service\PolicyService.java'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

replacement = '''    @org.springframework.cache.annotation.Cacheable("plans")
    public List<InsurancePlan> getAllActivePlans() {
        List<InsurancePlan> allPlans = insurancePlanRepository.findByIsActiveTrue();
        // Deduplicate by plan name to prevent UI clutter if data.sql ran multiple times
        java.util.Map<String, InsurancePlan> distinctPlans = new java.util.HashMap<>();
        for (InsurancePlan plan : allPlans) {
            distinctPlans.putIfAbsent(plan.getPlanName(), plan);
        }
        return new java.util.ArrayList<>(distinctPlans.values());
    }'''

content = re.sub(r'    @org.springframework.cache.annotation.Cacheable\("plans"\)\s*public List<InsurancePlan> getAllActivePlans\(\) \{\s*return insurancePlanRepository.findByIsActiveTrue\(\);\s*\}', replacement, content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
