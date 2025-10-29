# Recommendation Algorithm - Visual Guide

## 🎯 Scoring Algorithm Visual Flow

### Story Recommendation Score Calculation

```
┌─────────────────────────────────────────────────────────────────┐
│                    STORY SCORING ALGORITHM                      │
│                    Maximum Score: 100 points                    │
└─────────────────────────────────────────────────────────────────┘

START: Story Input
  │
  ├─► [Factor 1] Author Subscription Check
  │   ├─ YES → +30 points (30%)
  │   └─ NO  → +0 points
  │
  ├─► [Factor 2] Mushroom Subscription Check
  │   ├─ YES → +25 points (25%)
  │   └─ NO  → +0 points
  │
  ├─► [Factor 3] Content-Based Matching
  │   │
  │   ├─ Extract user interests: ["tech", "coding", "ai"]
  │   ├─ Extract story hashtags: ["technology", "programming"]
  │   │
  │   ├─ Calculate matching ratio:
  │   │   matching_tags = 2
  │   │   total_tags = 2
  │   │   ratio = 2/2 = 1.0
  │   │
  │   └─ Score = ratio × 20 = +20 points (20%)
  │
  ├─► [Factor 4] Engagement Score (Log Scale)
  │   │
  │   ├─ Likes: 150
  │   ├─ Comments: 45
  │   ├─ Views: 1200
  │   │
  │   ├─ Calculate:
  │   │   log₁₀(150+1) × 5 = 2.18 × 5 = 10.9
  │   │   log₁₀(45+1) × 3 = 1.66 × 3 = 4.98
  │   │   log₁₀(1200+1) × 2 = 3.08 × 2 = 6.16
  │   │
  │   ├─ Sum = 21.24
  │   └─ Capped at 15 → +15 points (15%)
  │
  └─► [Factor 5] Freshness Boost
      │
      ├─ Days since creation = 2 days
      │
      ├─ Check age brackets:
      │   ├─ < 1 day  → +10 points (10%)
      │   ├─ < 7 days → +7 points  ← SELECTED
      │   └─ < 30 days → +4 points
      │
      └─ Score = +7 points (7%)

──────────────────────────────────────────────────────────────────
TOTAL SCORE = 30 + 25 + 20 + 15 + 7 = 97/100
──────────────────────────────────────────────────────────────────

END: Ranked Story with Score
```

---

## 📊 Score Weight Distribution

```
┌──────────────────────────────────────────────────────────┐
│          Score Component Visualization                    │
└──────────────────────────────────────────────────────────┘

     100 ────────────────────────────────────────────── MAX
       │
       │
  90 ──┼────
       │    ████████████████████████████████████████
  80 ──┼────                                         30% Author Follow
       │    ████████████████████████████████
  70 ──┼────                                         25% Mushroom Subscribe
       │    ████████████████████████
  60 ──┼────                                         20% Content Match
       │    █████████████████
  50 ──┼────                                         15% Engagement
       │    ██████████
  40 ──┼────                                         10% Freshness
       │    ████
  30 ──┼────
       │    ██
  20 ──┼────
       │    █
  10 ──┼────
       │
   0 ──┴───────────────────────────────────────────────────── MIN
      Author  Mushroom Content  Engagement  Freshness
```

---

## 🔄 Request Flow Diagram

```
                    USER REQUEST
                   /feed?page=1
                         │
                         ▼
          ┌──────────────────────────────┐
          │  RecommendationService        │
          │  .getPersonalizedFeed()       │
          └──────────────────────────────┘
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
    ┌─────────┐   ┌──────────┐   ┌────────────┐
    │  L1     │   │   L2     │   │    L3      │
    │ Redis   │   │ MongoDB  │   │ Real-time  │
    │ Cache   │   │ Precomputed│ │ Computation│
    └─────────┘   └──────────┘   └────────────┘
      │              │              │
      │ Hit?         │ Found?       │ Compute
      │ YES          │ YES          │ Score
      │ Return       │ Return       │ Return
      │ (<10ms)      │ (<150ms)     │ (<500ms)
      │              │              │
      └──────┬───────┴──────┬───────┘
             │              │
             └──────────────┘
                   │
                   ▼
            CACHE IN REDIS
            (10 min TTL)
                   │
                   ▼
        TRIGGER BACKGROUND
        RECOMPUTATION (async)
```

---

## 🎨 Scoring Algorithm Pseudo-Code

```python
FUNCTION calculateStoryScore(story, user, preferences, aggregate):
    score = 0.0
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FACTOR 1: Author Follow Boost (30 points)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    IF story.authorId IN preferences.subscribedUserIds:
        score += 30
    END IF
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FACTOR 2: Mushroom Subscription Boost (25 points)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    IF story.mushroomId EXISTS AND 
       story.mushroomId IN preferences.subscribedMushroomIds:
        score += 25
    END IF
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FACTOR 3: Content-Based Matching (20 points)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    IF user.interests EXISTS AND story.hashtags EXISTS:
        matchingTags = []
        FOR EACH hashtag IN story.hashtags:
            FOR EACH interest IN user.interests:
                IF hashtag.toLowerCase().includes(interest.toLowerCase()) OR
                   interest.toLowerCase().includes(hashtag.toLowerCase()):
                    matchingTags.append(hashtag)
                    BREAK
                END IF
            END FOR
        END FOR
        
        matchingRatio = matchingTags.length / MAX(story.hashtags.length, 1)
        contentScore = matchingRatio × 20
        score += contentScore
    END IF
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FACTOR 4: Engagement Score (15 points max, log scale)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    likes = aggregate.likesCount OR story.likesCount OR 0
    comments = aggregate.commentsCount OR story.commentsCount OR 0
    views = aggregate.viewsCount OR story.viewsCount OR 0
    
    engagementScore = 
        LOG₁₀(likes + 1) × 5 +
        LOG₁₀(comments + 1) × 3 +
        LOG₁₀(views + 1) × 2
    
    score += MIN(engagementScore, 15)  # Cap at 15
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FACTOR 5: Freshness Boost (10 points max)
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    currentTime = NOW()
    storyCreationTime = story.createdAt
    daysSinceCreation = (currentTime - storyCreationTime) / (24 × 60 × 60)
    
    IF daysSinceCreation < 1:
        score += 10  # Very fresh (< 1 day)
    ELSE IF daysSinceCreation < 7:
        score += 7   # This week
    ELSE IF daysSinceCreation < 30:
        score += 4   # This month
    END IF
    # Older stories get no freshness boost
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # RETURN FINAL SCORE
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    RETURN ROUND(score, 2)
END FUNCTION
```

---

## 📈 Engagement Score Logarithmic Scale

```
Linear vs Logarithmic Engagement Scoring

┌─────────────────────────────────────────────────────┐
│  Engagement Score Comparison                        │
└─────────────────────────────────────────────────────┘

Points
 15 ┤                                    ████████ (Log Scale)
    │                                    ██████
 12 ┤                              ██████
    │                          ████
  9 ┤                      ████
    │                  ████
  6 ┤              ████
    │          ████
  3 ┤      ████
    │  ████
  0 ┼───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───
     0  10  50  100 500 1K  5K  10K 50K 100K 500K 1M  Likes

Legend:
  ░░░░ = Linear Scale (would cause outliers to dominate)
  ████ = Logarithmic Scale (prevents outlier dominance)
```

**Why Logarithmic?**
- Prevents stories with millions of likes from dominating
- Gives fair representation to stories with moderate engagement
- Caps engagement score at 15 points maximum

**Example:**
```
Story A: 1,000,000 likes → log₁₀(1,000,001) × 5 = 6 × 5 = 30 → Capped at 15
Story B: 1,000 likes → log₁₀(1,001) × 5 = 3 × 5 = 15 → Gets 15
Story C: 100 likes → log₁₀(101) × 5 = 2 × 5 = 10 → Gets 10

Without log scale, Story A would dominate with 500,000 points!
```

---

## 🔍 Content Matching Algorithm

```
┌─────────────────────────────────────────────────────────────┐
│         Content-Based Matching (Hashtag vs Interests)         │
└─────────────────────────────────────────────────────────────┘

User Interests:  ["technology", "coding", "artificial intelligence"]
Story Hashtags:   ["technology", "programming", "tech", "AI"]

Step 1: Normalize (lowercase)
──────────────────────────────────────────────────────────────
User:  ["technology", "coding", "artificial intelligence"]
Story: ["technology", "programming", "tech", "ai"]

Step 2: Find Matches (bidirectional check)
──────────────────────────────────────────────────────────────
"technology" IN story? → YES ✓ (exact match)
"coding" IN story? → NO ✗
"artificial intelligence" IN story? → NO ✗
  └─ Check partial: "artificial intelligence" contains "ai"? → YES ✓

Story hashtag checking:
"programming" contains "coding"? → YES ✓
"tech" contains "technology"? → YES ✓

Step 3: Count Matches
──────────────────────────────────────────────────────────────
Matches: 4 total
  - technology ↔ technology (exact)
  - coding ↔ programming (partial)
  - artificial intelligence ↔ ai (partial)
  - technology ↔ tech (partial)

Step 4: Calculate Score
──────────────────────────────────────────────────────────────
matchingRatio = 4 / 4 = 1.0 (perfect match!)
contentScore = 1.0 × 20 = 20 points
```

---

## 🎯 Complete Example Calculation

```
┌──────────────────────────────────────────────────────────────┐
│              COMPLETE SCORING EXAMPLE                         │
└──────────────────────────────────────────────────────────────┘

INPUT DATA:
───────────
Story:
  - ID: "story-123"
  - Author: "user-456" (subscribed ✓)
  - Mushroom: "mushroom-789" (subscribed ✓)
  - Hashtags: ["technology", "programming", "ai"]
  - Created: 2 days ago
  - Likes: 150
  - Comments: 45
  - Views: 1200

User:
  - Interests: ["technology", "coding", "artificial intelligence"]
  - Subscribed Users: ["user-456", "user-789"]
  - Subscribed Mushrooms: ["mushroom-789", "mushroom-111"]

CALCULATION:
───────────

[Factor 1] Author Follow
  user-456 IN subscribedUsers? → YES
  Score: +30

[Factor 2] Mushroom Subscribe
  mushroom-789 IN subscribedMushrooms? → YES
  Score: +25

[Factor 3] Content Match
  Matching hashtags:
    - "technology" matches "technology" ✓
    - "programming" matches "coding" ✓
    - "ai" matches "artificial intelligence" ✓
  Ratio: 3/3 = 1.0
  Score: 1.0 × 20 = +20

[Factor 4] Engagement
  Likes: log₁₀(151) × 5 = 2.18 × 5 = 10.9
  Comments: log₁₀(46) × 3 = 1.66 × 3 = 4.98
  Views: log₁₀(1201) × 2 = 3.08 × 2 = 6.16
  Subtotal: 21.24 → Capped at 15
  Score: +15

[Factor 5] Freshness
  Age: 2 days (< 7 days)
  Score: +7

───────────────────────────────────────────────────────────────
TOTAL SCORE: 30 + 25 + 20 + 15 + 7 = 97/100
───────────────────────────────────────────────────────────────

RANKING:
────────
Story-123 is ranked #1 in user's feed (Score: 97/100)
```

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                          │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  RecommendationService (Main API)                       │  │
│  │  • getPersonalizedFeed()                               │  │
│  │  • getRecommendedMushrooms()                           │  │
│  │  • getRecommendedUsers()                                │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Redis Cache    │ │  MongoDB         │ │  Compute Service │
│  (L1 - Fast)    │ │  (L2 - Fast)     │ │  (L3 - Real-time)│
│                 │ │                  │ │                  │
│  TTL: 10 min    │ │  Precomputed     │ │  On-demand       │
│  Key: feed:*    │ │  Fresh: <1 hour  │ │  Scoring         │
└─────────────────┘ └─────────────────┘ └─────────────────┘
         │                  │                  │
         └──────────────────┼──────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    SCHEDULER LAYER                            │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  RecommendationSchedulerService                         │  │
│  │  • Daily: Active users (100)                           │  │
│  │  • Hourly: Very active (20)                            │  │
│  │  • Weekly: All users (batch 50)                        │  │
│  │  • Daily: Inactive (200/day)                           │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  PostgreSQL  │  │   MongoDB    │  │    Redis     │        │
│  │              │  │              │  │              │        │
│  │ • Stories    │  │ • Precomputed│  │ • Cache      │        │
│  │ • Users      │  │   Recs       │  │              │        │
│  │ • Likes      │  │ • Aggregates  │  │              │        │
│  │ • Subscriptions│              │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Batch Processing Flow

```
SCHEDULED JOB TRIGGER
        │
        ▼
┌──────────────────────────────────────────┐
│  RecommendationSchedulerService         │
│  • Select target users                   │
│  • Batch size: 50 users                 │
└──────────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────────┐
│  RecommendationComputeService            │
│  .batchComputeRecommendations()           │
└──────────────────────────────────────────┘
        │
        ├─► Process Batch 1 (users 1-50)
        │   │
        │   ├─► For each user:
        │   │   │
        │   │   ├─► Fetch preferences (parallel)
        │   │   ├─► Fetch stories (limit 500)
        │   │   ├─► Score all stories
        │   │   ├─► Filter & rank
        │   │   └─► Save to MongoDB
        │   │
        │   └─► Wait for batch completion
        │
        ├─► Process Batch 2 (users 51-100)
        │   └─► Same process...
        │
        └─► Continue until all users processed
                    │
                    ▼
        ┌───────────────────────────────┐
        │  MongoDB: user_recommendations│
        │  Collection updated            │
        └───────────────────────────────┘
```

---

## 📝 Key Takeaways

1. **Scoring Algorithm**: Weighted multi-factor system (100 points max)
   - Author Follow: 30%
   - Mushroom Subscribe: 25%
   - Content Match: 20%
   - Engagement: 15% (log scale)
   - Freshness: 10%

2. **Performance**: 3-tier caching
   - L1 Redis: <10ms
   - L2 MongoDB: <150ms
   - L3 Real-time: <500ms

3. **Scalability**: Background jobs precompute recommendations
   - Daily: 100 active users
   - Hourly: 20 very active users
   - Weekly: All users (batch processing)

4. **Logarithmic Engagement**: Prevents outlier dominance
   - Normalizes large engagement numbers
   - Fair representation for all stories

