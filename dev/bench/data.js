window.BENCHMARK_DATA = {
  "lastUpdate": 1783609886280,
  "repoUrl": "https://github.com/stnkvcmls/running-coach",
  "entries": {
    "API Endpoint Benchmarks": [
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2fcc37f7af5b0fa3b0474ca591d0caeb51627820",
          "message": "Merge pull request #65 from stnkvcmls/claude/performance-test-marathon-data-vkjp6j\n\nAdd API performance test suite with committed marathon dataset",
          "timestamp": "2026-06-20T13:04:07+02:00",
          "tree_id": "4b01056668db6e204520dbb780afbf95d5fe9a72",
          "url": "https://github.com/stnkvcmls/running-coach/commit/2fcc37f7af5b0fa3b0474ca591d0caeb51627820"
        },
        "date": 1781953499987,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 416.4588738397821,
            "unit": "iter/sec",
            "range": "stddev: 0.00016362402329552658",
            "extra": "mean: 2.4011974838713965 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 30.429349249934376,
            "unit": "iter/sec",
            "range": "stddev: 0.02199833116200076",
            "extra": "mean: 32.86300971428617 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 31.605075354255668,
            "unit": "iter/sec",
            "range": "stddev: 0.021780146614365187",
            "extra": "mean: 31.640487763157587 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 99.87214068932894,
            "unit": "iter/sec",
            "range": "stddev: 0.0002487415459083881",
            "extra": "mean: 10.012802299999635 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 166.15750667425118,
            "unit": "iter/sec",
            "range": "stddev: 0.00011543622448849085",
            "extra": "mean: 6.0183859280007255 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 198.4075471413455,
            "unit": "iter/sec",
            "range": "stddev: 0.00008219601499493972",
            "extra": "mean: 5.0401308539316805 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 200.83521446340106,
            "unit": "iter/sec",
            "range": "stddev: 0.00011460346685695025",
            "extra": "mean: 4.9792064736845925 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 280.69295951686075,
            "unit": "iter/sec",
            "range": "stddev: 0.00010984582520361204",
            "extra": "mean: 3.562611622754049 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 159.66867828682896,
            "unit": "iter/sec",
            "range": "stddev: 0.008731812200662005",
            "extra": "mean: 6.262969110344855 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 246.580468750932,
            "unit": "iter/sec",
            "range": "stddev: 0.00011949736381327776",
            "extra": "mean: 4.055471242574724 msec\nrounds: 202"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 313.2840292064762,
            "unit": "iter/sec",
            "range": "stddev: 0.00011654470747885501",
            "extra": "mean: 3.191991633065118 msec\nrounds: 248"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 161.8422623788394,
            "unit": "iter/sec",
            "range": "stddev: 0.00011187114805711262",
            "extra": "mean: 6.178855790208901 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 252.4575446685268,
            "unit": "iter/sec",
            "range": "stddev: 0.00013822952836823563",
            "extra": "mean: 3.961062052286795 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 239.54191338642187,
            "unit": "iter/sec",
            "range": "stddev: 0.0076304256070021835",
            "extra": "mean: 4.174634767932365 msec\nrounds: 237"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 293.61369532058285,
            "unit": "iter/sec",
            "range": "stddev: 0.00011415450800453613",
            "extra": "mean: 3.405835681159721 msec\nrounds: 276"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 252.8503476139838,
            "unit": "iter/sec",
            "range": "stddev: 0.00011541779453730331",
            "extra": "mean: 3.95490854347829 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 16.363154457580674,
            "unit": "iter/sec",
            "range": "stddev: 0.0003300156930584791",
            "extra": "mean: 61.112910875000814 msec\nrounds: 16"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 221.62133574170218,
            "unit": "iter/sec",
            "range": "stddev: 0.00026847695813617963",
            "extra": "mean: 4.512200942446677 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.443004528948148,
            "unit": "iter/sec",
            "range": "stddev: 0.004499551520540198",
            "extra": "mean: 105.89849839999914 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.899854587664766,
            "unit": "iter/sec",
            "range": "stddev: 0.026906465831677565",
            "extra": "mean: 43.66839955999808 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.58763574053277,
            "unit": "iter/sec",
            "range": "stddev: 0.020002050562384906",
            "extra": "mean: 26.604493214284457 msec\nrounds: 42"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 132.73487213790636,
            "unit": "iter/sec",
            "range": "stddev: 0.000133678926436595",
            "extra": "mean: 7.533815220472273 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 229.62937599462185,
            "unit": "iter/sec",
            "range": "stddev: 0.00012043173609481531",
            "extra": "mean: 4.354843519774321 msec\nrounds: 177"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 226.22816262308191,
            "unit": "iter/sec",
            "range": "stddev: 0.00015602675387834617",
            "extra": "mean: 4.42031614634159 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 202.31032525804304,
            "unit": "iter/sec",
            "range": "stddev: 0.00011301610916117923",
            "extra": "mean: 4.9429014496641175 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 16.021440601028488,
            "unit": "iter/sec",
            "range": "stddev: 0.00031049599565960325",
            "extra": "mean: 62.416359733331696 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 190.42331266742028,
            "unit": "iter/sec",
            "range": "stddev: 0.00012591830127780748",
            "extra": "mean: 5.251457849315585 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 242.5490612183862,
            "unit": "iter/sec",
            "range": "stddev: 0.00011991842283254021",
            "extra": "mean: 4.122877223175976 msec\nrounds: 233"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 202.87374137627515,
            "unit": "iter/sec",
            "range": "stddev: 0.00014573832273906412",
            "extra": "mean: 4.929174141592204 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 220.82970320535483,
            "unit": "iter/sec",
            "range": "stddev: 0.009370030738220729",
            "extra": "mean: 4.528376325670628 msec\nrounds: 261"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b8f5a726a38056fe50a80077881e7f57bf5fda2d",
          "message": "Merge pull request #66 from stnkvcmls/claude/funny-pascal-zg57vy\n\nP3-1: Cache training-load series and threshold estimates",
          "timestamp": "2026-06-20T14:51:04+02:00",
          "tree_id": "94f50edabef2ec7bd6c09a0c2a4dd86d16f014ec",
          "url": "https://github.com/stnkvcmls/running-coach/commit/b8f5a726a38056fe50a80077881e7f57bf5fda2d"
        },
        "date": 1781959916185,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 428.6892183424023,
            "unit": "iter/sec",
            "range": "stddev: 0.00020413606122867686",
            "extra": "mean: 2.3326922096773637 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 97.18684600261942,
            "unit": "iter/sec",
            "range": "stddev: 0.0003229665535903801",
            "extra": "mean: 10.289458307691635 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 120.18475983640289,
            "unit": "iter/sec",
            "range": "stddev: 0.00017558624223603723",
            "extra": "mean: 8.320522513513474 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 93.48367297389854,
            "unit": "iter/sec",
            "range": "stddev: 0.009009860646686449",
            "extra": "mean: 10.697055091953958 msec\nrounds: 87"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 167.9069799808436,
            "unit": "iter/sec",
            "range": "stddev: 0.00011176353113236854",
            "extra": "mean: 5.955678555555518 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 201.35418901167338,
            "unit": "iter/sec",
            "range": "stddev: 0.00009372182095947677",
            "extra": "mean: 4.966372961538067 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 205.52258545271727,
            "unit": "iter/sec",
            "range": "stddev: 0.00010020782764113343",
            "extra": "mean: 4.865645290502932 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 243.10737941037317,
            "unit": "iter/sec",
            "range": "stddev: 0.006928711543971224",
            "extra": "mean: 4.113408660919204 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 183.9139759277193,
            "unit": "iter/sec",
            "range": "stddev: 0.00008110090922505388",
            "extra": "mean: 5.437324678321421 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 249.0577140631086,
            "unit": "iter/sec",
            "range": "stddev: 0.0001202886589023945",
            "extra": "mean: 4.015133615763496 msec\nrounds: 203"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 310.822296752636,
            "unit": "iter/sec",
            "range": "stddev: 0.00016730588563195845",
            "extra": "mean: 3.2172724107879467 msec\nrounds: 241"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 147.0588445632187,
            "unit": "iter/sec",
            "range": "stddev: 0.008124641279622319",
            "extra": "mean: 6.799999027396905 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 232.63346869162282,
            "unit": "iter/sec",
            "range": "stddev: 0.00013932630696400538",
            "extra": "mean: 4.298607614906833 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 283.3500444431483,
            "unit": "iter/sec",
            "range": "stddev: 0.00011328920092362461",
            "extra": "mean: 3.529203610909054 msec\nrounds: 275"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 262.6928604874109,
            "unit": "iter/sec",
            "range": "stddev: 0.006187242779104349",
            "extra": "mean: 3.806726982014509 msec\nrounds: 278"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 250.2950446033084,
            "unit": "iter/sec",
            "range": "stddev: 0.00012040506992027378",
            "extra": "mean: 3.995284851064054 msec\nrounds: 188"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 214.99562985548638,
            "unit": "iter/sec",
            "range": "stddev: 0.00023764387604813993",
            "extra": "mean: 4.651257333333565 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 221.42569454207546,
            "unit": "iter/sec",
            "range": "stddev: 0.00019603135134588906",
            "extra": "mean: 4.516187708332915 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.050680625664066,
            "unit": "iter/sec",
            "range": "stddev: 0.00552471080621127",
            "extra": "mean: 110.4889280000009 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 23.629776921973374,
            "unit": "iter/sec",
            "range": "stddev: 0.02074467326299772",
            "extra": "mean: 42.31948542307643 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.58678702673957,
            "unit": "iter/sec",
            "range": "stddev: 0.0012618873863513328",
            "extra": "mean: 25.260953846154095 msec\nrounds: 39"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 120.95560219319,
            "unit": "iter/sec",
            "range": "stddev: 0.010238572298808176",
            "extra": "mean: 8.26749635294116 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 228.88750724747254,
            "unit": "iter/sec",
            "range": "stddev: 0.00011735448374210436",
            "extra": "mean: 4.368958411167468 msec\nrounds: 197"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 226.6036388284313,
            "unit": "iter/sec",
            "range": "stddev: 0.00010654875474195998",
            "extra": "mean: 4.4129917999998725 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 201.892842895109,
            "unit": "iter/sec",
            "range": "stddev: 0.00010930941428697368",
            "extra": "mean: 4.953122585526907 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 179.09448292988534,
            "unit": "iter/sec",
            "range": "stddev: 0.00013605248877547697",
            "extra": "mean: 5.583644921052622 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 187.56865170009183,
            "unit": "iter/sec",
            "range": "stddev: 0.00014080663921357096",
            "extra": "mean: 5.331381288590403 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 241.58627273213767,
            "unit": "iter/sec",
            "range": "stddev: 0.00011686532972218133",
            "extra": "mean: 4.139308035555334 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 203.22014721397434,
            "unit": "iter/sec",
            "range": "stddev: 0.00013260838632169332",
            "extra": "mean: 4.920771949579788 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 253.1042319777672,
            "unit": "iter/sec",
            "range": "stddev: 0.0001253401968243009",
            "extra": "mean: 3.95094144489785 msec\nrounds: 245"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "174f163f7a7731d91f310ade8ef414d584d8b7f9",
          "message": "Merge pull request #67 from stnkvcmls/claude/focused-albattani-qxc2bm\n\nP2-2: Per-interval adherence (lap ↔ step alignment)",
          "timestamp": "2026-06-20T15:55:11+02:00",
          "tree_id": "f97d660122a5f8d81a0851bfe388ead017051a3c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/174f163f7a7731d91f310ade8ef414d584d8b7f9"
        },
        "date": 1781963759896,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 393.09889617133405,
            "unit": "iter/sec",
            "range": "stddev: 0.00014922627290442207",
            "extra": "mean: 2.543889107142507 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 93.70278969000603,
            "unit": "iter/sec",
            "range": "stddev: 0.00042843339327823174",
            "extra": "mean: 10.672040857142763 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 105.73349308726664,
            "unit": "iter/sec",
            "range": "stddev: 0.00887822030504582",
            "extra": "mean: 9.457741069564918 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 82.29320318594841,
            "unit": "iter/sec",
            "range": "stddev: 0.013612533889175106",
            "extra": "mean: 12.151671842696608 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.66965389249984,
            "unit": "iter/sec",
            "range": "stddev: 0.00006986624131604274",
            "extra": "mean: 6.147428091663917 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 189.96866790479623,
            "unit": "iter/sec",
            "range": "stddev: 0.0001224519264036092",
            "extra": "mean: 5.264025962961192 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 194.22454113811133,
            "unit": "iter/sec",
            "range": "stddev: 0.00010214819639843952",
            "extra": "mean: 5.148679946108916 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 260.6405855531465,
            "unit": "iter/sec",
            "range": "stddev: 0.00010592503626285822",
            "extra": "mean: 3.836701018292076 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 151.18823749469757,
            "unit": "iter/sec",
            "range": "stddev: 0.009262880438110278",
            "extra": "mean: 6.614271166664482 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 232.8553176581089,
            "unit": "iter/sec",
            "range": "stddev: 0.00014170733872901332",
            "extra": "mean: 4.2945121891880325 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 293.8723758485556,
            "unit": "iter/sec",
            "range": "stddev: 0.00010575585408708631",
            "extra": "mean: 3.4028377016128277 msec\nrounds: 248"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 140.05849248814704,
            "unit": "iter/sec",
            "range": "stddev: 0.009883500574067462",
            "extra": "mean: 7.139874078572055 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 214.86050261594897,
            "unit": "iter/sec",
            "range": "stddev: 0.00011326391000572928",
            "extra": "mean: 4.654182540880693 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 262.67603639077316,
            "unit": "iter/sec",
            "range": "stddev: 0.00012967088555776213",
            "extra": "mean: 3.806970798479455 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 274.5584500162336,
            "unit": "iter/sec",
            "range": "stddev: 0.0002064508663459838",
            "extra": "mean: 3.642211703704161 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 232.72403143206307,
            "unit": "iter/sec",
            "range": "stddev: 0.00038981617173711056",
            "extra": "mean: 4.296934845303762 msec\nrounds: 181"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 202.00926203813106,
            "unit": "iter/sec",
            "range": "stddev: 0.0001752110498012902",
            "extra": "mean: 4.950268071427542 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 182.40293953433485,
            "unit": "iter/sec",
            "range": "stddev: 0.010136172428707286",
            "extra": "mean: 5.48236778723494 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.661285799068111,
            "unit": "iter/sec",
            "range": "stddev: 0.004267601247070683",
            "extra": "mean: 130.52639285714105 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.496802698158138,
            "unit": "iter/sec",
            "range": "stddev: 0.027496260765161425",
            "extra": "mean: 44.450761000000774 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 34.90946206576322,
            "unit": "iter/sec",
            "range": "stddev: 0.0012030220696367733",
            "extra": "mean: 28.645528771431017 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 113.80329571375404,
            "unit": "iter/sec",
            "range": "stddev: 0.011257275096413449",
            "extra": "mean: 8.787091742187059 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 219.98822341541597,
            "unit": "iter/sec",
            "range": "stddev: 0.00010516669217268217",
            "extra": "mean: 4.545697876343338 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.08491666346768,
            "unit": "iter/sec",
            "range": "stddev: 0.00012740389095807915",
            "extra": "mean: 4.606492313559644 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 193.43769444205572,
            "unit": "iter/sec",
            "range": "stddev: 0.0001267643611701603",
            "extra": "mean: 5.169623236486362 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 166.99802754406235,
            "unit": "iter/sec",
            "range": "stddev: 0.0003266050550234897",
            "extra": "mean: 5.988094678161096 msec\nrounds: 87"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 178.96347318488492,
            "unit": "iter/sec",
            "range": "stddev: 0.00023617982744760456",
            "extra": "mean: 5.587732413792129 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.59616299964864,
            "unit": "iter/sec",
            "range": "stddev: 0.00015681359693857046",
            "extra": "mean: 4.317860827433126 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 198.36906675495766,
            "unit": "iter/sec",
            "range": "stddev: 0.00014710357995207022",
            "extra": "mean: 5.041108557693045 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 246.05048030753048,
            "unit": "iter/sec",
            "range": "stddev: 0.00010419820182390985",
            "extra": "mean: 4.0642066569028135 msec\nrounds: 239"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "34448a4cc1d3b9970d410d4e8d667d42b281f643",
          "message": "Merge pull request #68 from stnkvcmls/claude/p1-2-sleep-data-assignment-7avzov\n\nP1-2: HRV sync into readiness + fix overnight-data date attribution",
          "timestamp": "2026-06-21T07:00:20+02:00",
          "tree_id": "1e55b7c037b3b1b88f95ff6ef2bd2e5a2d3f3a8a",
          "url": "https://github.com/stnkvcmls/running-coach/commit/34448a4cc1d3b9970d410d4e8d667d42b281f643"
        },
        "date": 1782018072186,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 389.7306843343612,
            "unit": "iter/sec",
            "range": "stddev: 0.00014939867652751776",
            "extra": "mean: 2.5658744363635253 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 97.12435630346407,
            "unit": "iter/sec",
            "range": "stddev: 0.00021760841389015985",
            "extra": "mean: 10.296078533334216 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 106.5768093599493,
            "unit": "iter/sec",
            "range": "stddev: 0.008209510516688464",
            "extra": "mean: 9.382904273505039 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 75.03623763932032,
            "unit": "iter/sec",
            "range": "stddev: 0.013680477410663971",
            "extra": "mean: 13.326894197530798 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.03260843426756,
            "unit": "iter/sec",
            "range": "stddev: 0.0000873970291343178",
            "extra": "mean: 6.171597246153537 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 184.46571640098676,
            "unit": "iter/sec",
            "range": "stddev: 0.00010097988432634332",
            "extra": "mean: 5.421061536585076 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 183.29157565975353,
            "unit": "iter/sec",
            "range": "stddev: 0.00009893358019157248",
            "extra": "mean: 5.455788114650248 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 257.5048218611943,
            "unit": "iter/sec",
            "range": "stddev: 0.0001063982400488301",
            "extra": "mean: 3.8834224259266157 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 148.92175646368395,
            "unit": "iter/sec",
            "range": "stddev: 0.00935469815854703",
            "extra": "mean: 6.714935572518982 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 228.89398827203152,
            "unit": "iter/sec",
            "range": "stddev: 0.00019748802748631705",
            "extra": "mean: 4.368834706185202 msec\nrounds: 194"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 292.0781569457983,
            "unit": "iter/sec",
            "range": "stddev: 0.00009855449999856412",
            "extra": "mean: 3.4237411330473875 msec\nrounds: 233"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 157.52262192217762,
            "unit": "iter/sec",
            "range": "stddev: 0.00013727141242898033",
            "extra": "mean: 6.348294535714619 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 185.49030858466577,
            "unit": "iter/sec",
            "range": "stddev: 0.009009320687892286",
            "extra": "mean: 5.391117237500076 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 262.8980781009441,
            "unit": "iter/sec",
            "range": "stddev: 0.00011345418824283507",
            "extra": "mean: 3.8037554600001044 msec\nrounds: 250"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 272.7100104590753,
            "unit": "iter/sec",
            "range": "stddev: 0.00014176874214435057",
            "extra": "mean: 3.6668987629629632 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 231.36734389058824,
            "unit": "iter/sec",
            "range": "stddev: 0.0001484796149267713",
            "extra": "mean: 4.322131132182993 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 192.4623125111185,
            "unit": "iter/sec",
            "range": "stddev: 0.00017982835532663103",
            "extra": "mean: 5.195822428571465 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 212.228122889313,
            "unit": "iter/sec",
            "range": "stddev: 0.00014170757951701795",
            "extra": "mean: 4.711910873949289 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.3587722730305085,
            "unit": "iter/sec",
            "range": "stddev: 0.008784164850149013",
            "extra": "mean: 135.89223350000168 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 24.590264647011747,
            "unit": "iter/sec",
            "range": "stddev: 0.022503896696161062",
            "extra": "mean: 40.66650011111295 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.41306463443223,
            "unit": "iter/sec",
            "range": "stddev: 0.001492570852259764",
            "extra": "mean: 29.928413060605582 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 131.4103278389871,
            "unit": "iter/sec",
            "range": "stddev: 0.00010704551592375745",
            "extra": "mean: 7.609751961240583 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 219.4107508928421,
            "unit": "iter/sec",
            "range": "stddev: 0.0000956105371968632",
            "extra": "mean: 4.557661809782464 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 214.99119164347374,
            "unit": "iter/sec",
            "range": "stddev: 0.00037138184244288195",
            "extra": "mean: 4.651353352458875 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 195.52365711335412,
            "unit": "iter/sec",
            "range": "stddev: 0.00010686920023674751",
            "extra": "mean: 5.114470620914449 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 172.2042566913152,
            "unit": "iter/sec",
            "range": "stddev: 0.00012620492531668134",
            "extra": "mean: 5.807057381819256 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 183.56566569084515,
            "unit": "iter/sec",
            "range": "stddev: 0.0001036052969337232",
            "extra": "mean: 5.447641835615189 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 233.29531830078014,
            "unit": "iter/sec",
            "range": "stddev: 0.00012581185802891358",
            "extra": "mean: 4.286412634782204 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 198.35370538532698,
            "unit": "iter/sec",
            "range": "stddev: 0.00012003680959210398",
            "extra": "mean: 5.041498962963028 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 247.2971350503074,
            "unit": "iter/sec",
            "range": "stddev: 0.00010552937701891663",
            "extra": "mean: 4.043718500000297 msec\nrounds: 246"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "48d25e6acfb27e06ee140e6f211032887e3c9c7a",
          "message": "Merge pull request #69 from stnkvcmls/claude/settings-page-issue-fcu8uj\n\nfix: exclude internal cache blobs from settings sync status display",
          "timestamp": "2026-06-21T08:45:36+02:00",
          "tree_id": "cbc8e35bb11665eceee291e3037e633b90d65479",
          "url": "https://github.com/stnkvcmls/running-coach/commit/48d25e6acfb27e06ee140e6f211032887e3c9c7a"
        },
        "date": 1782024394522,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 375.8533279995552,
            "unit": "iter/sec",
            "range": "stddev: 0.0002743853242137809",
            "extra": "mean: 2.6606123333333462 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 77.85294349717185,
            "unit": "iter/sec",
            "range": "stddev: 0.00022557218711691617",
            "extra": "mean: 12.84472950000056 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 89.449872994349,
            "unit": "iter/sec",
            "range": "stddev: 0.00038624701529970686",
            "extra": "mean: 11.179445722222267 msec\nrounds: 90"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 67.29315600667718,
            "unit": "iter/sec",
            "range": "stddev: 0.01679263979808439",
            "extra": "mean: 14.860352216216084 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 111.23281390132085,
            "unit": "iter/sec",
            "range": "stddev: 0.013937120678019447",
            "extra": "mean: 8.990152859812937 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 159.58090913399298,
            "unit": "iter/sec",
            "range": "stddev: 0.0003755990582249033",
            "extra": "mean: 6.266413729729692 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 160.93701978806166,
            "unit": "iter/sec",
            "range": "stddev: 0.0004055035436064202",
            "extra": "mean: 6.213610773437351 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 233.46732679845715,
            "unit": "iter/sec",
            "range": "stddev: 0.0002646849511329733",
            "extra": "mean: 4.283254593749897 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 153.4580616978932,
            "unit": "iter/sec",
            "range": "stddev: 0.0003239552968015893",
            "extra": "mean: 6.516438360655567 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 200.0196773314924,
            "unit": "iter/sec",
            "range": "stddev: 0.00032343332088314864",
            "extra": "mean: 4.9995081151076 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 265.91566365829,
            "unit": "iter/sec",
            "range": "stddev: 0.00029268034123704423",
            "extra": "mean: 3.7605908062829707 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 112.65356231730684,
            "unit": "iter/sec",
            "range": "stddev: 0.014591105352964392",
            "extra": "mean: 8.876772109374931 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 205.3303300431505,
            "unit": "iter/sec",
            "range": "stddev: 0.00026599562955141305",
            "extra": "mean: 4.8702011037037165 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 237.70086954635744,
            "unit": "iter/sec",
            "range": "stddev: 0.00030246582881717393",
            "extra": "mean: 4.206968202970648 msec\nrounds: 202"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 249.49503486597942,
            "unit": "iter/sec",
            "range": "stddev: 0.00031138952791797216",
            "extra": "mean: 4.008095794520189 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 200.38279042426075,
            "unit": "iter/sec",
            "range": "stddev: 0.012666928852137037",
            "extra": "mean: 4.990448520467993 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 209.74113623118845,
            "unit": "iter/sec",
            "range": "stddev: 0.00038636519004423534",
            "extra": "mean: 4.767781933333974 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 221.42893590884887,
            "unit": "iter/sec",
            "range": "stddev: 0.00012968618793763334",
            "extra": "mean: 4.516121598541438 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.01579931105573,
            "unit": "iter/sec",
            "range": "stddev: 0.005945158371515776",
            "extra": "mean: 110.91639969999534 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 16.170385945473985,
            "unit": "iter/sec",
            "range": "stddev: 0.05513427162597787",
            "extra": "mean: 61.841442954544654 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 38.15300361689677,
            "unit": "iter/sec",
            "range": "stddev: 0.000780065836287888",
            "extra": "mean: 26.21025621052628 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 104.50429821443105,
            "unit": "iter/sec",
            "range": "stddev: 0.00047178100309543184",
            "extra": "mean: 9.568984406250092 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 197.020416643136,
            "unit": "iter/sec",
            "range": "stddev: 0.00039591116019427894",
            "extra": "mean: 5.075616106382034 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 185.6804240399096,
            "unit": "iter/sec",
            "range": "stddev: 0.00042952581819689326",
            "extra": "mean: 5.385597351851495 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 164.06837301850837,
            "unit": "iter/sec",
            "range": "stddev: 0.00044176103019966546",
            "extra": "mean: 6.09501990909114 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 141.55661289447053,
            "unit": "iter/sec",
            "range": "stddev: 0.0005643344816093199",
            "extra": "mean: 7.064311440861425 msec\nrounds: 93"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 154.15621286559102,
            "unit": "iter/sec",
            "range": "stddev: 0.0004695936019564226",
            "extra": "mean: 6.486926354839173 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 210.26115266298356,
            "unit": "iter/sec",
            "range": "stddev: 0.0003996413565112881",
            "extra": "mean: 4.75599028795798 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 170.883052726479,
            "unit": "iter/sec",
            "range": "stddev: 0.0005312336518751046",
            "extra": "mean: 5.8519553814422585 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 183.12405569848485,
            "unit": "iter/sec",
            "range": "stddev: 0.015948065423920264",
            "extra": "mean: 5.460779012269734 msec\nrounds: 163"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4170ca1a6b0053b0db208a590043d40c7825349e",
          "message": "Merge pull request #70 from stnkvcmls/claude/p3-3-implementation-n2oroc\n\nP3-3: adopt Alembic for schema migrations",
          "timestamp": "2026-06-21T08:59:18+02:00",
          "tree_id": "9524af728e8170a8a1ffa19a1a2678a493ebf59c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/4170ca1a6b0053b0db208a590043d40c7825349e"
        },
        "date": 1782025213117,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 423.77511834737857,
            "unit": "iter/sec",
            "range": "stddev: 0.00017903761492739988",
            "extra": "mean: 2.359742129032399 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 95.92623612292212,
            "unit": "iter/sec",
            "range": "stddev: 0.0004981003689386229",
            "extra": "mean: 10.424676714288848 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 111.5594177417309,
            "unit": "iter/sec",
            "range": "stddev: 0.00033633358678480675",
            "extra": "mean: 8.963833087719058 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 68.61934671599258,
            "unit": "iter/sec",
            "range": "stddev: 0.01950020075471298",
            "extra": "mean: 14.573149525000328 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 160.96771323778063,
            "unit": "iter/sec",
            "range": "stddev: 0.00019328959351187666",
            "extra": "mean: 6.212425957265141 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 189.50739907893353,
            "unit": "iter/sec",
            "range": "stddev: 0.00010081354925158837",
            "extra": "mean: 5.276838819277343 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.61111261557534,
            "unit": "iter/sec",
            "range": "stddev: 0.0000730024975254268",
            "extra": "mean: 5.301914537974158 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 274.21062446775454,
            "unit": "iter/sec",
            "range": "stddev: 0.0001372092569791024",
            "extra": "mean: 3.646831708074804 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 176.6399569930581,
            "unit": "iter/sec",
            "range": "stddev: 0.00028134679358988063",
            "extra": "mean: 5.661233262411288 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 239.0302134899353,
            "unit": "iter/sec",
            "range": "stddev: 0.00016650386997949415",
            "extra": "mean: 4.183571546875209 msec\nrounds: 192"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 259.48787866773665,
            "unit": "iter/sec",
            "range": "stddev: 0.008944133278645378",
            "extra": "mean: 3.853744556910337 msec\nrounds: 246"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 156.39047108861516,
            "unit": "iter/sec",
            "range": "stddev: 0.0003953157735415045",
            "extra": "mean: 6.394251472222834 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 207.97096030868875,
            "unit": "iter/sec",
            "range": "stddev: 0.010508195868707772",
            "extra": "mean: 4.808363622092778 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 272.4622521835857,
            "unit": "iter/sec",
            "range": "stddev: 0.0005359047797200137",
            "extra": "mean: 3.6702331863798796 msec\nrounds: 279"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 289.98544972422735,
            "unit": "iter/sec",
            "range": "stddev: 0.00011549487810843774",
            "extra": "mean: 3.4484488823525044 msec\nrounds: 272"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 249.37805247787423,
            "unit": "iter/sec",
            "range": "stddev: 0.00011616774772943001",
            "extra": "mean: 4.009975978494434 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 216.7082274521237,
            "unit": "iter/sec",
            "range": "stddev: 0.00012937576209553022",
            "extra": "mean: 4.614499466666189 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 219.86939205387102,
            "unit": "iter/sec",
            "range": "stddev: 0.00012442823211742375",
            "extra": "mean: 4.548154659721742 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.273585431775873,
            "unit": "iter/sec",
            "range": "stddev: 0.006686841762706527",
            "extra": "mean: 107.83315766666766 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.770747318091985,
            "unit": "iter/sec",
            "range": "stddev: 0.03574018212833737",
            "extra": "mean: 45.93319583333629 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 36.535023926871204,
            "unit": "iter/sec",
            "range": "stddev: 0.02490156940492344",
            "extra": "mean: 27.370996170732173 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 132.21637230756468,
            "unit": "iter/sec",
            "range": "stddev: 0.00009947520487335696",
            "extra": "mean: 7.563359836206802 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 227.64589223251912,
            "unit": "iter/sec",
            "range": "stddev: 0.00014014442008603917",
            "extra": "mean: 4.392787368983548 msec\nrounds: 187"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 222.8407094228345,
            "unit": "iter/sec",
            "range": "stddev: 0.00012806505309630322",
            "extra": "mean: 4.487510395160903 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 198.97918568821115,
            "unit": "iter/sec",
            "range": "stddev: 0.00014813954904728513",
            "extra": "mean: 5.025651283782727 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 176.15095571928455,
            "unit": "iter/sec",
            "range": "stddev: 0.00015420707498083546",
            "extra": "mean: 5.676949045871811 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 184.7345488722488,
            "unit": "iter/sec",
            "range": "stddev: 0.0001338487909488465",
            "extra": "mean: 5.413172609588795 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 234.42753521384455,
            "unit": "iter/sec",
            "range": "stddev: 0.0001378641278144163",
            "extra": "mean: 4.265710506608369 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 182.88077541970813,
            "unit": "iter/sec",
            "range": "stddev: 0.0002952925747359109",
            "extra": "mean: 5.468043306930528 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 205.6400806360313,
            "unit": "iter/sec",
            "range": "stddev: 0.011686698534243974",
            "extra": "mean: 4.86286523963162 msec\nrounds: 217"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e47df67140a77fb7b6a8ec45701a83ac1e366ff3",
          "message": "Merge pull request #71 from stnkvcmls/fix/alembic-dockerfile\n\nfix: add alembic/ to Docker image",
          "timestamp": "2026-06-21T09:50:32+02:00",
          "tree_id": "ae1a65e93ced588f755a3a937a5913434016fd83",
          "url": "https://github.com/stnkvcmls/running-coach/commit/e47df67140a77fb7b6a8ec45701a83ac1e366ff3"
        },
        "date": 1782028285051,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 388.6744724939527,
            "unit": "iter/sec",
            "range": "stddev: 0.00018384110379732156",
            "extra": "mean: 2.5728471272719324 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 95.76707804894312,
            "unit": "iter/sec",
            "range": "stddev: 0.000235881084418142",
            "extra": "mean: 10.442001785717382 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 106.13959131535789,
            "unit": "iter/sec",
            "range": "stddev: 0.008808946444265468",
            "extra": "mean: 9.421555025860599 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.08832661544903,
            "unit": "iter/sec",
            "range": "stddev: 0.014156370462459307",
            "extra": "mean: 13.497402974026384 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 160.56114791897593,
            "unit": "iter/sec",
            "range": "stddev: 0.00012170819267073628",
            "extra": "mean: 6.228156767443084 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 184.07189279108317,
            "unit": "iter/sec",
            "range": "stddev: 0.0001102430934810095",
            "extra": "mean: 5.432659950614915 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.57003484464042,
            "unit": "iter/sec",
            "range": "stddev: 0.00009971709751072299",
            "extra": "mean: 5.477350107595471 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 254.70160781767123,
            "unit": "iter/sec",
            "range": "stddev: 0.00015707545313339347",
            "extra": "mean: 3.926162887498741 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 170.56186849534257,
            "unit": "iter/sec",
            "range": "stddev: 0.00011934343259196477",
            "extra": "mean: 5.862975170369374 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 203.81219643211327,
            "unit": "iter/sec",
            "range": "stddev: 0.007363187934102215",
            "extra": "mean: 4.906477715788146 msec\nrounds: 190"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 289.8754075037482,
            "unit": "iter/sec",
            "range": "stddev: 0.00010974996270224008",
            "extra": "mean: 3.449757979165824 msec\nrounds: 240"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 156.15107055655906,
            "unit": "iter/sec",
            "range": "stddev: 0.0002686379016130934",
            "extra": "mean: 6.4040547172412285 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 231.95696788313978,
            "unit": "iter/sec",
            "range": "stddev: 0.00011297241876624687",
            "extra": "mean: 4.311144472727379 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 260.63961696257206,
            "unit": "iter/sec",
            "range": "stddev: 0.00012444869041605718",
            "extra": "mean: 3.8367152762643917 msec\nrounds: 257"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 245.94444889300087,
            "unit": "iter/sec",
            "range": "stddev: 0.007034464742524393",
            "extra": "mean: 4.065958815094274 msec\nrounds: 265"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 236.61740730026327,
            "unit": "iter/sec",
            "range": "stddev: 0.00013077875043512654",
            "extra": "mean: 4.226231752810214 msec\nrounds: 178"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 192.32478755084122,
            "unit": "iter/sec",
            "range": "stddev: 0.00032511373220710357",
            "extra": "mean: 5.199537785713915 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 211.76125224728534,
            "unit": "iter/sec",
            "range": "stddev: 0.00010950548785663179",
            "extra": "mean: 4.722299237408384 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.426457984348099,
            "unit": "iter/sec",
            "range": "stddev: 0.007674493896409815",
            "extra": "mean: 134.6536938750056 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 24.319150326500527,
            "unit": "iter/sec",
            "range": "stddev: 0.023598866241298463",
            "extra": "mean: 41.11985766666782 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.583355720676636,
            "unit": "iter/sec",
            "range": "stddev: 0.0015113400155038934",
            "extra": "mean: 29.77665508823226 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 116.20206765129035,
            "unit": "iter/sec",
            "range": "stddev: 0.010700454847514886",
            "extra": "mean: 8.60569885039301 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 213.29965508932872,
            "unit": "iter/sec",
            "range": "stddev: 0.00021027290080543316",
            "extra": "mean: 4.688240117318547 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 215.90006305620471,
            "unit": "iter/sec",
            "range": "stddev: 0.0001412016260540696",
            "extra": "mean: 4.6317726166651125 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 194.13908057282194,
            "unit": "iter/sec",
            "range": "stddev: 0.00009040901607594317",
            "extra": "mean: 5.150946409395908 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 169.559603696929,
            "unit": "iter/sec",
            "range": "stddev: 0.00011378791462441398",
            "extra": "mean: 5.897631146787775 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 180.91673554290756,
            "unit": "iter/sec",
            "range": "stddev: 0.00011708152630094637",
            "extra": "mean: 5.5274046206899 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.94048423199004,
            "unit": "iter/sec",
            "range": "stddev: 0.00009669225555733375",
            "extra": "mean: 4.311450859091017 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 197.97359579963776,
            "unit": "iter/sec",
            "range": "stddev: 0.00010758650919421951",
            "extra": "mean: 5.051178648146925 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 240.0391206634032,
            "unit": "iter/sec",
            "range": "stddev: 0.00029155780342660326",
            "extra": "mean: 4.165987599172462 msec\nrounds: 242"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "63cadb6cdfb6d462d5b35f1ff304fa703f185bae",
          "message": "Merge pull request #72 from stnkvcmls/claude/p0-1-improvement-plan-js6p5i\n\nfeat: P0-1 — ACWR, ramp rate, and injury-risk flag",
          "timestamp": "2026-06-21T10:18:12+02:00",
          "tree_id": "a035ce726ee1bf1bbb403bfe3745cf39fdcd3156",
          "url": "https://github.com/stnkvcmls/running-coach/commit/63cadb6cdfb6d462d5b35f1ff304fa703f185bae"
        },
        "date": 1782029944963,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 413.70582578461864,
            "unit": "iter/sec",
            "range": "stddev: 0.00022139214921179762",
            "extra": "mean: 2.417176500000788 msec\nrounds: 60"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 75.38898406992865,
            "unit": "iter/sec",
            "range": "stddev: 0.0005709905984817474",
            "extra": "mean: 13.264537416665926 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 69.15706012306507,
            "unit": "iter/sec",
            "range": "stddev: 0.01907937344170963",
            "extra": "mean: 14.459839649350318 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 65.83736304724654,
            "unit": "iter/sec",
            "range": "stddev: 0.025004793528457542",
            "extra": "mean: 15.18894368965499 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 152.7112325855815,
            "unit": "iter/sec",
            "range": "stddev: 0.00023692588761946537",
            "extra": "mean: 6.548306781818331 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 175.1973837433585,
            "unit": "iter/sec",
            "range": "stddev: 0.0003447323927946705",
            "extra": "mean: 5.707847792207163 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 174.63522240539803,
            "unit": "iter/sec",
            "range": "stddev: 0.0002937230092002128",
            "extra": "mean: 5.726221699300734 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 270.2981223348119,
            "unit": "iter/sec",
            "range": "stddev: 0.00014619675720556517",
            "extra": "mean: 3.6996187445258073 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 125.37176506502436,
            "unit": "iter/sec",
            "range": "stddev: 0.01803587741797787",
            "extra": "mean: 7.976277589147346 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 229.41854657085636,
            "unit": "iter/sec",
            "range": "stddev: 0.00018329342402685297",
            "extra": "mean: 4.358845502890273 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 301.44577150124667,
            "unit": "iter/sec",
            "range": "stddev: 0.00015229302033897916",
            "extra": "mean: 3.3173462511013008 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 144.9174349140427,
            "unit": "iter/sec",
            "range": "stddev: 0.00037360052730202786",
            "extra": "mean: 6.900480957264713 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 240.20216144123327,
            "unit": "iter/sec",
            "range": "stddev: 0.00018941630110958882",
            "extra": "mean: 4.163159873333011 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 272.08404574277284,
            "unit": "iter/sec",
            "range": "stddev: 0.00017112514465769863",
            "extra": "mean: 3.675334940239002 msec\nrounds: 251"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 230.27919518311236,
            "unit": "iter/sec",
            "range": "stddev: 0.013963787742940633",
            "extra": "mean: 4.342554694117393 msec\nrounds: 255"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 237.99906191877866,
            "unit": "iter/sec",
            "range": "stddev: 0.0008856178945611011",
            "extra": "mean: 4.201697233333077 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 196.19116160498908,
            "unit": "iter/sec",
            "range": "stddev: 0.00034375789123910317",
            "extra": "mean: 5.097069571428493 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 190.42962996754233,
            "unit": "iter/sec",
            "range": "stddev: 0.0003442679522260884",
            "extra": "mean: 5.251283637795465 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.140241780671542,
            "unit": "iter/sec",
            "range": "stddev: 0.08101947276950754",
            "extra": "mean: 140.0512798750002 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.366438613599485,
            "unit": "iter/sec",
            "range": "stddev: 0.05051411366933083",
            "extra": "mean: 57.582330047618974 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 38.103632175065385,
            "unit": "iter/sec",
            "range": "stddev: 0.0011375933439377738",
            "extra": "mean: 26.24421722857144 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 118.26176697452019,
            "unit": "iter/sec",
            "range": "stddev: 0.00029330166311232096",
            "extra": "mean: 8.455818186916256 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 221.24983067964385,
            "unit": "iter/sec",
            "range": "stddev: 0.00018282443188498044",
            "extra": "mean: 4.519777470238784 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.59862127112626,
            "unit": "iter/sec",
            "range": "stddev: 0.00020074740834462735",
            "extra": "mean: 4.595617353448245 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 191.53100978059092,
            "unit": "iter/sec",
            "range": "stddev: 0.00018866659144918543",
            "extra": "mean: 5.221086659259791 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 169.94055843196202,
            "unit": "iter/sec",
            "range": "stddev: 0.00022735466949992596",
            "extra": "mean: 5.88441046226386 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 133.820227512213,
            "unit": "iter/sec",
            "range": "stddev: 0.02241889417878207",
            "extra": "mean: 7.472711850745702 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.71549959428486,
            "unit": "iter/sec",
            "range": "stddev: 0.00018462282738878792",
            "extra": "mean: 4.315637071110561 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.62917100028469,
            "unit": "iter/sec",
            "range": "stddev: 0.00023029297402734136",
            "extra": "mean: 5.301406960000321 msec\nrounds: 100"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 240.96996640247772,
            "unit": "iter/sec",
            "range": "stddev: 0.00018513897676509684",
            "extra": "mean: 4.149894756302367 msec\nrounds: 238"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5928f6fbb9ede8e40818267b7bfb2f813b00cc5b",
          "message": "Merge pull request #73 from stnkvcmls/claude/p0-2-improvements-btqrz7\n\nfeat: P0-2 — power-duration/pace curve view + race predictions",
          "timestamp": "2026-06-21T10:41:38+02:00",
          "tree_id": "8cf1b67374e71e3a49484307d296b18894ebf729",
          "url": "https://github.com/stnkvcmls/running-coach/commit/5928f6fbb9ede8e40818267b7bfb2f813b00cc5b"
        },
        "date": 1782031352732,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 386.2846388845803,
            "unit": "iter/sec",
            "range": "stddev: 0.00016552209000456942",
            "extra": "mean: 2.5887646034477556 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 83.43585572046615,
            "unit": "iter/sec",
            "range": "stddev: 0.00024400207322874506",
            "extra": "mean: 11.985254916666577 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 85.73930422790214,
            "unit": "iter/sec",
            "range": "stddev: 0.00925754694626004",
            "extra": "mean: 11.6632623626373 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 75.26390650416509,
            "unit": "iter/sec",
            "range": "stddev: 0.014340886407957179",
            "extra": "mean: 13.286581130952328 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.84605550557316,
            "unit": "iter/sec",
            "range": "stddev: 0.00009137544429940307",
            "extra": "mean: 6.140768942148412 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 184.75983716526707,
            "unit": "iter/sec",
            "range": "stddev: 0.0001065827295125924",
            "extra": "mean: 5.4124317023807675 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.90670048270246,
            "unit": "iter/sec",
            "range": "stddev: 0.00018661357210888563",
            "extra": "mean: 5.467268270440264 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 256.2789068991714,
            "unit": "iter/sec",
            "range": "stddev: 0.00012824449134169637",
            "extra": "mean: 3.9019988500006875 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 169.22093661976476,
            "unit": "iter/sec",
            "range": "stddev: 0.0003611542937665004",
            "extra": "mean: 5.909434257812762 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 205.18845000550075,
            "unit": "iter/sec",
            "range": "stddev: 0.007227637531257149",
            "extra": "mean: 4.873568663212728 msec\nrounds: 193"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 291.98148581895975,
            "unit": "iter/sec",
            "range": "stddev: 0.00009790736784848551",
            "extra": "mean: 3.4248746875000156 msec\nrounds: 224"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 141.59967264483464,
            "unit": "iter/sec",
            "range": "stddev: 0.008484305597428365",
            "extra": "mean: 7.062163219178026 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 230.33684336479507,
            "unit": "iter/sec",
            "range": "stddev: 0.00012973925281226377",
            "extra": "mean: 4.34146784939765 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 263.1503881319003,
            "unit": "iter/sec",
            "range": "stddev: 0.00011349258275969219",
            "extra": "mean: 3.800108398467437 msec\nrounds: 261"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.23033842061136,
            "unit": "iter/sec",
            "range": "stddev: 0.00009722606346275313",
            "extra": "mean: 3.6201671609195825 msec\nrounds: 261"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 238.20472750839835,
            "unit": "iter/sec",
            "range": "stddev: 0.00011928780160166022",
            "extra": "mean: 4.198069494505491 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 205.3665055004083,
            "unit": "iter/sec",
            "range": "stddev: 0.00010545555951464515",
            "extra": "mean: 4.869343214285798 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.051925086745992,
            "unit": "iter/sec",
            "range": "stddev: 0.0004076440469552082",
            "extra": "mean: 34.42112689655179 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 213.7165367394038,
            "unit": "iter/sec",
            "range": "stddev: 0.0001076994729936327",
            "extra": "mean: 4.679095100719111 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.732757898093499,
            "unit": "iter/sec",
            "range": "stddev: 0.04783770061820818",
            "extra": "mean: 148.5275447500003 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 23.928565362554096,
            "unit": "iter/sec",
            "range": "stddev: 0.023227318440404297",
            "extra": "mean: 41.79105537036934 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.4790717229779,
            "unit": "iter/sec",
            "range": "stddev: 0.0016128465585168686",
            "extra": "mean: 29.869406424242758 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 114.3506351989262,
            "unit": "iter/sec",
            "range": "stddev: 0.01062554980719821",
            "extra": "mean: 8.745032314515646 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 217.65206785664375,
            "unit": "iter/sec",
            "range": "stddev: 0.00010980831652514315",
            "extra": "mean: 4.594488854838948 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.21360787647947,
            "unit": "iter/sec",
            "range": "stddev: 0.0001292677781189774",
            "extra": "mean: 4.603763133333061 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 194.2328605856822,
            "unit": "iter/sec",
            "range": "stddev: 0.0000976822572807947",
            "extra": "mean: 5.148459416108268 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 170.59382100011825,
            "unit": "iter/sec",
            "range": "stddev: 0.0001257258041429647",
            "extra": "mean: 5.8618770254246595 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.01494087592081,
            "unit": "iter/sec",
            "range": "stddev: 0.00011060516422688013",
            "extra": "mean: 5.494054472603421 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.1634050737562,
            "unit": "iter/sec",
            "range": "stddev: 0.0001108157102196241",
            "extra": "mean: 4.32594423706873 msec\nrounds: 232"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 197.41920561906272,
            "unit": "iter/sec",
            "range": "stddev: 0.0001329308409041192",
            "extra": "mean: 5.065363305784877 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 242.89308647882615,
            "unit": "iter/sec",
            "range": "stddev: 0.00014098653159187838",
            "extra": "mean: 4.1170377242794585 msec\nrounds: 243"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "254278d39d2c2c4b616fcf534949d897fa7ad145",
          "message": "Merge pull request #74 from stnkvcmls/claude/p0-3-improvements-drzfvs\n\nfeat: P0-3 — closed-loop plan generation (adherence + readiness aware)",
          "timestamp": "2026-06-21T10:55:23+02:00",
          "tree_id": "9926776adf7d775802622dcd7365825c6c814489",
          "url": "https://github.com/stnkvcmls/running-coach/commit/254278d39d2c2c4b616fcf534949d897fa7ad145"
        },
        "date": 1782032178963,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.3732810955358,
            "unit": "iter/sec",
            "range": "stddev: 0.00019611712949432658",
            "extra": "mean: 2.635926275862782 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 79.73115028203564,
            "unit": "iter/sec",
            "range": "stddev: 0.000321730138339393",
            "extra": "mean: 12.542149416666723 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 83.55312901739676,
            "unit": "iter/sec",
            "range": "stddev: 0.010496059396662361",
            "extra": "mean: 11.968432681818392 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 77.87996622836815,
            "unit": "iter/sec",
            "range": "stddev: 0.011083411668838146",
            "extra": "mean: 12.840272645569602 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 141.86360145656676,
            "unit": "iter/sec",
            "range": "stddev: 0.0087629662641763",
            "extra": "mean: 7.049024483606966 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 182.23351422069092,
            "unit": "iter/sec",
            "range": "stddev: 0.00014589192020508375",
            "extra": "mean: 5.487464829268267 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.26363323078627,
            "unit": "iter/sec",
            "range": "stddev: 0.0001188530745290114",
            "extra": "mean: 5.547430627450681 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 252.18811685579314,
            "unit": "iter/sec",
            "range": "stddev: 0.00022341858698828797",
            "extra": "mean: 3.965293894366255 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 168.50794623020084,
            "unit": "iter/sec",
            "range": "stddev: 0.0001809300187546685",
            "extra": "mean: 5.934438240876115 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 228.41703809344614,
            "unit": "iter/sec",
            "range": "stddev: 0.00012388005782327797",
            "extra": "mean: 4.377957127659176 msec\nrounds: 188"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 251.8297246609194,
            "unit": "iter/sec",
            "range": "stddev: 0.007828833518458351",
            "extra": "mean: 3.9709371137440894 msec\nrounds: 211"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 155.0980271065784,
            "unit": "iter/sec",
            "range": "stddev: 0.00015359180828073126",
            "extra": "mean: 6.447535269503022 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 231.56356179787053,
            "unit": "iter/sec",
            "range": "stddev: 0.000123488945852725",
            "extra": "mean: 4.318468727272773 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 226.30055266628685,
            "unit": "iter/sec",
            "range": "stddev: 0.0077152088531345",
            "extra": "mean: 4.418902155641864 msec\nrounds: 257"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 274.75228963209724,
            "unit": "iter/sec",
            "range": "stddev: 0.00011507783168643014",
            "extra": "mean: 3.6396420984845452 msec\nrounds: 264"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 235.650942622788,
            "unit": "iter/sec",
            "range": "stddev: 0.0001423790643019779",
            "extra": "mean: 4.243564608187134 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 201.11850331750657,
            "unit": "iter/sec",
            "range": "stddev: 0.00011749683091108636",
            "extra": "mean: 4.972192928570556 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.19595489391602,
            "unit": "iter/sec",
            "range": "stddev: 0.00036336941654994064",
            "extra": "mean: 35.466080285714135 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 211.40613897566487,
            "unit": "iter/sec",
            "range": "stddev: 0.00012923921607839206",
            "extra": "mean: 4.7302316046513235 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.420317117102452,
            "unit": "iter/sec",
            "range": "stddev: 0.0059389344951548614",
            "extra": "mean: 134.76512987500033 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.14944110437302,
            "unit": "iter/sec",
            "range": "stddev: 0.0363066406867165",
            "extra": "mean: 49.62916811538612 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.164441592652615,
            "unit": "iter/sec",
            "range": "stddev: 0.0010687265085473022",
            "extra": "mean: 31.09023351515084 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 128.43147595809765,
            "unit": "iter/sec",
            "range": "stddev: 0.0002159212414220731",
            "extra": "mean: 7.786253272727803 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 216.61930477855307,
            "unit": "iter/sec",
            "range": "stddev: 0.00013808753258300554",
            "extra": "mean: 4.616393728261136 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 214.25338707919337,
            "unit": "iter/sec",
            "range": "stddev: 0.00016966563443345265",
            "extra": "mean: 4.66737078761035 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 189.00169901728927,
            "unit": "iter/sec",
            "range": "stddev: 0.00025646969096692327",
            "extra": "mean: 5.2909577278907065 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 166.77314385543409,
            "unit": "iter/sec",
            "range": "stddev: 0.00020575704131143609",
            "extra": "mean: 5.996169268517487 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 177.36964317074234,
            "unit": "iter/sec",
            "range": "stddev: 0.0001905666318490652",
            "extra": "mean: 5.637943348836555 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 199.56961083819974,
            "unit": "iter/sec",
            "range": "stddev: 0.009676301314183842",
            "extra": "mean: 5.010782933333202 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 189.26706029412927,
            "unit": "iter/sec",
            "range": "stddev: 0.0002767843239607937",
            "extra": "mean: 5.283539557522351 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 239.31746102717102,
            "unit": "iter/sec",
            "range": "stddev: 0.0001697107081607456",
            "extra": "mean: 4.178550097046468 msec\nrounds: 237"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ef9c75b39ebd5b139d7c50c1b8a0b5ae4085855f",
          "message": "Merge pull request #75 from stnkvcmls/claude/p1-1-improvement-plan-oq4jwq\n\nfeat: P1-1 — plan realignment after missed sessions",
          "timestamp": "2026-06-21T11:18:34+02:00",
          "tree_id": "b60c7a8bf068ff29e9d03833878dca379948febb",
          "url": "https://github.com/stnkvcmls/running-coach/commit/ef9c75b39ebd5b139d7c50c1b8a0b5ae4085855f"
        },
        "date": 1782033564733,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 420.70484328407565,
            "unit": "iter/sec",
            "range": "stddev: 0.0002465120721546333",
            "extra": "mean: 2.376963365084824 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 79.75028363334991,
            "unit": "iter/sec",
            "range": "stddev: 0.0004520636313008889",
            "extra": "mean: 12.539140357136246 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 91.67278103967914,
            "unit": "iter/sec",
            "range": "stddev: 0.0001593251572607184",
            "extra": "mean: 10.9083632967038 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 79.57066311929063,
            "unit": "iter/sec",
            "range": "stddev: 0.0126470018552508",
            "extra": "mean: 12.567445849996517 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 162.20846995365133,
            "unit": "iter/sec",
            "range": "stddev: 0.0001386913358007708",
            "extra": "mean: 6.164906186993411 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 149.05076159080735,
            "unit": "iter/sec",
            "range": "stddev: 0.013082390220395526",
            "extra": "mean: 6.709123719510566 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.1218842108106,
            "unit": "iter/sec",
            "range": "stddev: 0.00011032290715783784",
            "extra": "mean: 5.315702658386057 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 271.5927633517675,
            "unit": "iter/sec",
            "range": "stddev: 0.00012827817198474975",
            "extra": "mean: 3.681983229813815 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 173.9546909911098,
            "unit": "iter/sec",
            "range": "stddev: 0.0001294791965077427",
            "extra": "mean: 5.74862335877511 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 236.62272957866708,
            "unit": "iter/sec",
            "range": "stddev: 0.000145615873826411",
            "extra": "mean: 4.226136693548462 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 308.644548130617,
            "unit": "iter/sec",
            "range": "stddev: 0.00010848518879192418",
            "extra": "mean: 3.239972991769174 msec\nrounds: 243"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 133.64457279318452,
            "unit": "iter/sec",
            "range": "stddev: 0.012624680151820632",
            "extra": "mean: 7.482533552241614 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 245.69430759726916,
            "unit": "iter/sec",
            "range": "stddev: 0.00013457234126875987",
            "extra": "mean: 4.070098366459324 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 268.24869350666233,
            "unit": "iter/sec",
            "range": "stddev: 0.0005720710238588106",
            "extra": "mean: 3.727883953235968 msec\nrounds: 278"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 286.64168622598856,
            "unit": "iter/sec",
            "range": "stddev: 0.00013636073468578907",
            "extra": "mean: 3.488676099998934 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.6364321133806,
            "unit": "iter/sec",
            "range": "stddev: 0.00036528058311039536",
            "extra": "mean: 4.261912743016744 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 206.3877510170058,
            "unit": "iter/sec",
            "range": "stddev: 0.0002508835092306904",
            "extra": "mean: 4.845248785707262 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.648809218611262,
            "unit": "iter/sec",
            "range": "stddev: 0.001191623358071355",
            "extra": "mean: 36.16792289654446 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 215.8365939786155,
            "unit": "iter/sec",
            "range": "stddev: 0.00013790503698117283",
            "extra": "mean: 4.633134639342378 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 172.04276267500018,
            "unit": "iter/sec",
            "range": "stddev: 0.00040823046671589736",
            "extra": "mean: 5.812508381355537 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.536027663695211,
            "unit": "iter/sec",
            "range": "stddev: 0.004491741269597819",
            "extra": "mean: 104.86546760000692 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.83582211078776,
            "unit": "iter/sec",
            "range": "stddev: 0.035057010586467936",
            "extra": "mean: 47.99426654167149 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.054595547624544,
            "unit": "iter/sec",
            "range": "stddev: 0.0009361976107505453",
            "extra": "mean: 24.357809074990655 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 125.38000819373643,
            "unit": "iter/sec",
            "range": "stddev: 0.00027940004288965815",
            "extra": "mean: 7.975753187500243 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 220.80180584091053,
            "unit": "iter/sec",
            "range": "stddev: 0.00019575816223313134",
            "extra": "mean: 4.528948466664752 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 168.55035645246107,
            "unit": "iter/sec",
            "range": "stddev: 0.015866787643251227",
            "extra": "mean: 5.932945032258331 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 191.57958964575485,
            "unit": "iter/sec",
            "range": "stddev: 0.00023951957826374548",
            "extra": "mean: 5.219762720282863 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 172.81828244184476,
            "unit": "iter/sec",
            "range": "stddev: 0.00019344008109677786",
            "extra": "mean: 5.7864248265313645 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 181.9857934912889,
            "unit": "iter/sec",
            "range": "stddev: 0.00014520629271149135",
            "extra": "mean: 5.494934416668447 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 232.75104520128647,
            "unit": "iter/sec",
            "range": "stddev: 0.00017736605417494714",
            "extra": "mean: 4.296436130437934 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 222.65225178167142,
            "unit": "iter/sec",
            "range": "stddev: 0.0001946928051156284",
            "extra": "mean: 4.491308720203652 msec\nrounds: 193"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.70776189952667,
            "unit": "iter/sec",
            "range": "stddev: 0.0003023598681568682",
            "extra": "mean: 5.299199089290393 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 234.88581327352088,
            "unit": "iter/sec",
            "range": "stddev: 0.0002283299409178593",
            "extra": "mean: 4.257387817779848 msec\nrounds: 225"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "abbcddc5f8f8dcd474035f3432ade46e5db1335b",
          "message": "Merge pull request #76 from stnkvcmls/claude/p2-1-improvement-perf-ax2it4\n\nfeat(p2-1): time-in-zone / intensity distribution view",
          "timestamp": "2026-06-21T14:04:47+02:00",
          "tree_id": "a8a36cd8ffea6906a22a8d6ebc3f826d2ad3634f",
          "url": "https://github.com/stnkvcmls/running-coach/commit/abbcddc5f8f8dcd474035f3432ade46e5db1335b"
        },
        "date": 1782043542936,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 418.36621474716117,
            "unit": "iter/sec",
            "range": "stddev: 0.00022212165684844695",
            "extra": "mean: 2.3902503709682867 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 78.9952820979241,
            "unit": "iter/sec",
            "range": "stddev: 0.0002395636100822541",
            "extra": "mean: 12.658983846154005 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 89.14015012088538,
            "unit": "iter/sec",
            "range": "stddev: 0.0003715249499839643",
            "extra": "mean: 11.21828938636375 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.52380297351517,
            "unit": "iter/sec",
            "range": "stddev: 0.015526547552755747",
            "extra": "mean: 13.418531530863872 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 130.77998030875253,
            "unit": "iter/sec",
            "range": "stddev: 0.012917067682683813",
            "extra": "mean: 7.6464302689077135 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 187.89051473016244,
            "unit": "iter/sec",
            "range": "stddev: 0.00012514528241103478",
            "extra": "mean: 5.322248445783133 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 183.84345383231488,
            "unit": "iter/sec",
            "range": "stddev: 0.00021184641212437547",
            "extra": "mean: 5.439410428570974 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 273.34341571985516,
            "unit": "iter/sec",
            "range": "stddev: 0.00012006345085369668",
            "extra": "mean: 3.658401638709609 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 176.37948675361417,
            "unit": "iter/sec",
            "range": "stddev: 0.0001760164907988927",
            "extra": "mean: 5.669593547445273 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 238.45891354927738,
            "unit": "iter/sec",
            "range": "stddev: 0.00014981838349496302",
            "extra": "mean: 4.193594548913143 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 252.8848649096576,
            "unit": "iter/sec",
            "range": "stddev: 0.010146033508003697",
            "extra": "mean: 3.954368721739228 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 155.02827341715323,
            "unit": "iter/sec",
            "range": "stddev: 0.00016317321627067925",
            "extra": "mean: 6.450436284671633 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 240.7465232256801,
            "unit": "iter/sec",
            "range": "stddev: 0.00015878716391759052",
            "extra": "mean: 4.153746382715492 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 237.2269654124004,
            "unit": "iter/sec",
            "range": "stddev: 0.010132117193758566",
            "extra": "mean: 4.2153723893132415 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 285.7672796024667,
            "unit": "iter/sec",
            "range": "stddev: 0.00013779054129050048",
            "extra": "mean: 3.4993509452555536 msec\nrounds: 274"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 242.69975355015544,
            "unit": "iter/sec",
            "range": "stddev: 0.00011896111657915284",
            "extra": "mean: 4.120317327777359 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 208.78762351116342,
            "unit": "iter/sec",
            "range": "stddev: 0.00029482629537846",
            "extra": "mean: 4.789555928570317 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.637109865361644,
            "unit": "iter/sec",
            "range": "stddev: 0.0004282360023108137",
            "extra": "mean: 36.183233517240076 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 209.6487122365912,
            "unit": "iter/sec",
            "range": "stddev: 0.00018849544902559975",
            "extra": "mean: 4.769883818181947 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 211.76025718912166,
            "unit": "iter/sec",
            "range": "stddev: 0.0001765773853705098",
            "extra": "mean: 4.7223214274192475 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 172.16830714785613,
            "unit": "iter/sec",
            "range": "stddev: 0.0002037821956710758",
            "extra": "mean: 5.808269922414999 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.21450436038918,
            "unit": "iter/sec",
            "range": "stddev: 0.0037456400882331367",
            "extra": "mean: 108.52455659999976 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.139260587030755,
            "unit": "iter/sec",
            "range": "stddev: 0.03864502287102659",
            "extra": "mean: 49.65425595833336 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.00613384671029,
            "unit": "iter/sec",
            "range": "stddev: 0.02990753524151522",
            "extra": "mean: 30.29739880000122 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 108.31055017111115,
            "unit": "iter/sec",
            "range": "stddev: 0.00074126096461721",
            "extra": "mean: 9.232710926314937 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 183.75188572946442,
            "unit": "iter/sec",
            "range": "stddev: 0.0005396315186985371",
            "extra": "mean: 5.4421210211267566 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 194.03939024919816,
            "unit": "iter/sec",
            "range": "stddev: 0.0003286733603714736",
            "extra": "mean: 5.153592776784827 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 163.33149792098425,
            "unit": "iter/sec",
            "range": "stddev: 0.0005065531704838545",
            "extra": "mean: 6.122517779661676 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 144.20632037351493,
            "unit": "iter/sec",
            "range": "stddev: 0.0008372568041122715",
            "extra": "mean: 6.934508816325509 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 167.59514954595258,
            "unit": "iter/sec",
            "range": "stddev: 0.0003799978597678522",
            "extra": "mean: 5.9667597941181 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 220.4450223523805,
            "unit": "iter/sec",
            "range": "stddev: 0.0003746728138069371",
            "extra": "mean: 4.53627843046283 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 227.6274837329004,
            "unit": "iter/sec",
            "range": "stddev: 0.00014628505316381955",
            "extra": "mean: 4.393142618812264 msec\nrounds: 202"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 160.52424912973032,
            "unit": "iter/sec",
            "range": "stddev: 0.0010011847206493573",
            "extra": "mean: 6.2295883981480795 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 209.16373806641406,
            "unit": "iter/sec",
            "range": "stddev: 0.0006483115632749697",
            "extra": "mean: 4.780943433332971 msec\nrounds: 210"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d7c685f6e1c9eb58c47214c7a54f8cd9c93aad74",
          "message": "Merge pull request #77 from stnkvcmls/claude/multi-user-phase-2-0m1lhs\n\nfeat: Phase 2 — per-user Garmin credentials",
          "timestamp": "2026-06-21T14:48:33+02:00",
          "tree_id": "7ba49be048bff6317d55cf19bc6062d65bcc3dc5",
          "url": "https://github.com/stnkvcmls/running-coach/commit/d7c685f6e1c9eb58c47214c7a54f8cd9c93aad74"
        },
        "date": 1782046169117,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 370.6199470341581,
            "unit": "iter/sec",
            "range": "stddev: 0.00018425402361526828",
            "extra": "mean: 2.698181811320143 msec\nrounds: 53"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 80.72141481822393,
            "unit": "iter/sec",
            "range": "stddev: 0.0004065157799854368",
            "extra": "mean: 12.388286333334145 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 91.39376305034322,
            "unit": "iter/sec",
            "range": "stddev: 0.00021295740993092956",
            "extra": "mean: 10.941665674157232 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 70.70404998366229,
            "unit": "iter/sec",
            "range": "stddev: 0.01618406169491385",
            "extra": "mean: 14.143461375000044 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 140.01303298752188,
            "unit": "iter/sec",
            "range": "stddev: 0.009470206617900373",
            "extra": "mean: 7.14219225641031 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 182.108801303556,
            "unit": "iter/sec",
            "range": "stddev: 0.00007852980941825762",
            "extra": "mean: 5.491222790122627 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 164.8477443272405,
            "unit": "iter/sec",
            "range": "stddev: 0.000936003701079534",
            "extra": "mean: 6.066203720779415 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 249.51633122461254,
            "unit": "iter/sec",
            "range": "stddev: 0.00011128154997118782",
            "extra": "mean: 4.007753701299047 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 161.7105537958466,
            "unit": "iter/sec",
            "range": "stddev: 0.00038318534586536025",
            "extra": "mean: 6.183888290076984 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 220.2307974711214,
            "unit": "iter/sec",
            "range": "stddev: 0.00013499186979850698",
            "extra": "mean: 4.540691000000256 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.1146361618695,
            "unit": "iter/sec",
            "range": "stddev: 0.00015626974253226512",
            "extra": "mean: 3.5446583474181326 msec\nrounds: 213"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 145.04637703794498,
            "unit": "iter/sec",
            "range": "stddev: 0.00023104365550979505",
            "extra": "mean: 6.89434662499977 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 224.18487785137032,
            "unit": "iter/sec",
            "range": "stddev: 0.00018707279198047603",
            "extra": "mean: 4.4606041655627555 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 261.6281729878427,
            "unit": "iter/sec",
            "range": "stddev: 0.0001230401318438301",
            "extra": "mean: 3.822218335968229 msec\nrounds: 253"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.39846853980043,
            "unit": "iter/sec",
            "range": "stddev: 0.00010531281657417661",
            "extra": "mean: 3.617965053435176 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 237.33716253023036,
            "unit": "iter/sec",
            "range": "stddev: 0.00013303407317226816",
            "extra": "mean: 4.213415165746017 msec\nrounds: 181"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 197.62542604691814,
            "unit": "iter/sec",
            "range": "stddev: 0.00019566567439535033",
            "extra": "mean: 5.060077642856494 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.452828659741616,
            "unit": "iter/sec",
            "range": "stddev: 0.0005810372148894272",
            "extra": "mean: 35.14589048275951 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 207.0681318973641,
            "unit": "iter/sec",
            "range": "stddev: 0.0001224390559091467",
            "extra": "mean: 4.829328351190527 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 210.02943102264547,
            "unit": "iter/sec",
            "range": "stddev: 0.0001540460045240001",
            "extra": "mean: 4.761237485294047 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 160.86823734864663,
            "unit": "iter/sec",
            "range": "stddev: 0.00012741827360482968",
            "extra": "mean: 6.216267527272766 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.2989490657456155,
            "unit": "iter/sec",
            "range": "stddev: 0.004582937031279793",
            "extra": "mean: 137.00602524999894 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.281813456406578,
            "unit": "iter/sec",
            "range": "stddev: 0.040160565154053446",
            "extra": "mean: 51.86234180000014 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 30.73341222688074,
            "unit": "iter/sec",
            "range": "stddev: 0.00170221973728146",
            "extra": "mean: 32.5378774285713 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 117.70607763617467,
            "unit": "iter/sec",
            "range": "stddev: 0.000756611986345771",
            "extra": "mean: 8.495738028846436 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 206.49598192997746,
            "unit": "iter/sec",
            "range": "stddev: 0.0005180624280698817",
            "extra": "mean: 4.842709241379325 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 206.7779510836643,
            "unit": "iter/sec",
            "range": "stddev: 0.00016270899189017868",
            "extra": "mean: 4.836105565217593 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 181.44244100741696,
            "unit": "iter/sec",
            "range": "stddev: 0.00021833098910845893",
            "extra": "mean: 5.511389697182933 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 159.07294384348964,
            "unit": "iter/sec",
            "range": "stddev: 0.00036195354784944467",
            "extra": "mean: 6.286424176470202 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 174.4986934642864,
            "unit": "iter/sec",
            "range": "stddev: 0.00018015835801827104",
            "extra": "mean: 5.730701933333753 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 220.2745313469329,
            "unit": "iter/sec",
            "range": "stddev: 0.00016321804236014834",
            "extra": "mean: 4.539789479451883 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 218.09619084695862,
            "unit": "iter/sec",
            "range": "stddev: 0.00018757794890007627",
            "extra": "mean: 4.585132808219082 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 139.04689392428915,
            "unit": "iter/sec",
            "range": "stddev: 0.01598530022345023",
            "extra": "mean: 7.191818326732983 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 229.25330608223618,
            "unit": "iter/sec",
            "range": "stddev: 0.00019434855332116507",
            "extra": "mean: 4.361987258065045 msec\nrounds: 217"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "37614c96e741d9163b266e9b6eef7a4ad149784e",
          "message": "Merge pull request #79 from stnkvcmls/claude/multi-user-plan-phase-3-yjkr0y\n\nPhase 3 — multi-user data isolation",
          "timestamp": "2026-06-23T22:25:08+02:00",
          "tree_id": "4d102566c23e9ce9e8fa3356f48ea2bb79582ce1",
          "url": "https://github.com/stnkvcmls/running-coach/commit/37614c96e741d9163b266e9b6eef7a4ad149784e"
        },
        "date": 1782246364149,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.49859745616186,
            "unit": "iter/sec",
            "range": "stddev: 0.00018842611132902207",
            "extra": "mean: 2.6350558518612597 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 67.58550708360104,
            "unit": "iter/sec",
            "range": "stddev: 0.0003395721890195655",
            "extra": "mean: 14.796071571424818 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 84.6979743608762,
            "unit": "iter/sec",
            "range": "stddev: 0.009275890862223543",
            "extra": "mean: 11.80665780434439 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 81.68093905939833,
            "unit": "iter/sec",
            "range": "stddev: 0.009239433313946475",
            "extra": "mean: 12.242758365850822 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 82.46512527763021,
            "unit": "iter/sec",
            "range": "stddev: 0.0001916012588700987",
            "extra": "mean: 12.126338214285884 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 172.44336462465296,
            "unit": "iter/sec",
            "range": "stddev: 0.00013986123077063968",
            "extra": "mean: 5.799005384617955 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.97356290490117,
            "unit": "iter/sec",
            "range": "stddev: 0.00009958476093576079",
            "extra": "mean: 5.556371635140682 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.23444308262071,
            "unit": "iter/sec",
            "range": "stddev: 0.00008761457854741837",
            "extra": "mean: 5.0959453615335475 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.82377951243907,
            "unit": "iter/sec",
            "range": "stddev: 0.00008305558868781248",
            "extra": "mean: 7.051003741670077 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 167.75080210595667,
            "unit": "iter/sec",
            "range": "stddev: 0.007844487159778946",
            "extra": "mean: 5.961223358970103 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.73370663372305,
            "unit": "iter/sec",
            "range": "stddev: 0.00014368941169226016",
            "extra": "mean: 3.5368970042736496 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 134.04515126916536,
            "unit": "iter/sec",
            "range": "stddev: 0.008716660346060688",
            "extra": "mean: 7.460172863634432 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 214.11320724269714,
            "unit": "iter/sec",
            "range": "stddev: 0.00014365794724802546",
            "extra": "mean: 4.670426513514884 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.6168009709905,
            "unit": "iter/sec",
            "range": "stddev: 0.0001067526093279754",
            "extra": "mean: 3.851830837834489 msec\nrounds: 259"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 271.95877669475914,
            "unit": "iter/sec",
            "range": "stddev: 0.00010109786341608308",
            "extra": "mean: 3.6770278648604866 msec\nrounds: 259"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 231.22657102696985,
            "unit": "iter/sec",
            "range": "stddev: 0.00011179155287360377",
            "extra": "mean: 4.324762485377867 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 118.87219764738883,
            "unit": "iter/sec",
            "range": "stddev: 0.00005927438219291099",
            "extra": "mean: 8.412395999999132 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.69229553064952,
            "unit": "iter/sec",
            "range": "stddev: 0.0002388791454450456",
            "extra": "mean: 34.85256168966284 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 166.76913885421644,
            "unit": "iter/sec",
            "range": "stddev: 0.00011130939957507686",
            "extra": "mean: 5.996313267973182 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 205.06196782449175,
            "unit": "iter/sec",
            "range": "stddev: 0.0001244955115413987",
            "extra": "mean: 4.876574679395835 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 166.34194731698466,
            "unit": "iter/sec",
            "range": "stddev: 0.00009133311822113965",
            "extra": "mean: 6.01171271666298 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.119472884549633,
            "unit": "iter/sec",
            "range": "stddev: 0.007639191658679629",
            "extra": "mean: 140.45983687502428 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.14704960402797,
            "unit": "iter/sec",
            "range": "stddev: 0.024425188905076382",
            "extra": "mean: 45.15274123999461 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.59857505087833,
            "unit": "iter/sec",
            "range": "stddev: 0.0017874363883600653",
            "extra": "mean: 30.676187484859284 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.54831219702689,
            "unit": "iter/sec",
            "range": "stddev: 0.00009403197511083219",
            "extra": "mean: 7.902120404759486 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 208.1046269996766,
            "unit": "iter/sec",
            "range": "stddev: 0.0001679938241896327",
            "extra": "mean: 4.8052751849748825 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 207.27128917989396,
            "unit": "iter/sec",
            "range": "stddev: 0.00024080198202838782",
            "extra": "mean: 4.824594877354598 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 174.24368267215542,
            "unit": "iter/sec",
            "range": "stddev: 0.0001060097084127309",
            "extra": "mean: 5.739088985404017 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 105.34608966320874,
            "unit": "iter/sec",
            "range": "stddev: 0.00014242310174474084",
            "extra": "mean: 9.492521300002668 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 176.46519210316765,
            "unit": "iter/sec",
            "range": "stddev: 0.00010535278721402727",
            "extra": "mean: 5.666839947763553 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 224.47372946066392,
            "unit": "iter/sec",
            "range": "stddev: 0.000088662411841452",
            "extra": "mean: 4.45486428368553 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 223.28878940380528,
            "unit": "iter/sec",
            "range": "stddev: 0.00010696646056737663",
            "extra": "mean: 4.478505180085668 msec\nrounds: 211"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.42209889000276,
            "unit": "iter/sec",
            "range": "stddev: 0.00011021323162676212",
            "extra": "mean: 5.307233099997368 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 197.4505111016135,
            "unit": "iter/sec",
            "range": "stddev: 0.00027964041744675126",
            "extra": "mean: 5.0645602000258805 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6b72a3164246ff9ea29bd7cd913887b455ef8ddc",
          "message": "Merge pull request #80 from stnkvcmls/claude/p2-3-improvement-plan-xg3plq\n\nfeat: P2-3 strength/cross days + Runna-style training plan onboarding & preferences UI",
          "timestamp": "2026-06-24T06:34:03-07:00",
          "tree_id": "c996bc45ecb8d3e7a9d217e13a4baab67457100b",
          "url": "https://github.com/stnkvcmls/running-coach/commit/6b72a3164246ff9ea29bd7cd913887b455ef8ddc"
        },
        "date": 1782308100454,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 414.153192584552,
            "unit": "iter/sec",
            "range": "stddev: 0.00022534446768714556",
            "extra": "mean: 2.414565474575796 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 22.866653878648066,
            "unit": "iter/sec",
            "range": "stddev: 0.03600130141041563",
            "extra": "mean: 43.731802882351694 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 25.189682663082934,
            "unit": "iter/sec",
            "range": "stddev: 0.035804502453132166",
            "extra": "mean: 39.69879308823382 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 66.06448619893919,
            "unit": "iter/sec",
            "range": "stddev: 0.023508861687132263",
            "extra": "mean: 15.136725607593648 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.07023400703461,
            "unit": "iter/sec",
            "range": "stddev: 0.0003296265083977415",
            "extra": "mean: 12.975177938459671 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 181.15123716245415,
            "unit": "iter/sec",
            "range": "stddev: 0.00010926458154071287",
            "extra": "mean: 5.520249354428712 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 186.88624528348672,
            "unit": "iter/sec",
            "range": "stddev: 0.0001078928416707461",
            "extra": "mean: 5.3508485789476135 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 195.3601261850426,
            "unit": "iter/sec",
            "range": "stddev: 0.0001341665351122315",
            "extra": "mean: 5.118751812500433 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.77644171366325,
            "unit": "iter/sec",
            "range": "stddev: 0.00016999183494710815",
            "extra": "mean: 7.258134900001778 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 153.49449787437223,
            "unit": "iter/sec",
            "range": "stddev: 0.013721514495690871",
            "extra": "mean: 6.5148915032671155 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 301.7730255657232,
            "unit": "iter/sec",
            "range": "stddev: 0.000143119253356333",
            "extra": "mean: 3.313748795556977 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 153.23524213688154,
            "unit": "iter/sec",
            "range": "stddev: 0.00018307444905965085",
            "extra": "mean: 6.52591392198619 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 235.2741889432578,
            "unit": "iter/sec",
            "range": "stddev: 0.00012164218441849999",
            "extra": "mean: 4.2503599927027045 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 229.37245986738395,
            "unit": "iter/sec",
            "range": "stddev: 0.011237289233440344",
            "extra": "mean: 4.35972130472058 msec\nrounds: 233"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 290.5022170578825,
            "unit": "iter/sec",
            "range": "stddev: 0.00011986901584253765",
            "extra": "mean: 3.4423145204456405 msec\nrounds: 269"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 245.48861144345022,
            "unit": "iter/sec",
            "range": "stddev: 0.00017069235937167756",
            "extra": "mean: 4.073508722543554 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 110.34722724318306,
            "unit": "iter/sec",
            "range": "stddev: 0.00039034836011058105",
            "extra": "mean: 9.062302923082983 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.459280660675653,
            "unit": "iter/sec",
            "range": "stddev: 0.0004778030029574698",
            "extra": "mean: 36.417559962963516 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 157.29387128362347,
            "unit": "iter/sec",
            "range": "stddev: 0.0003420955183467832",
            "extra": "mean: 6.357526786258926 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 209.02296240771926,
            "unit": "iter/sec",
            "range": "stddev: 0.0001643282378232744",
            "extra": "mean: 4.78416336885229 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 114.3394291095687,
            "unit": "iter/sec",
            "range": "stddev: 0.00038478518716961326",
            "extra": "mean: 8.745889390804324 msec\nrounds: 87"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.295976505437744,
            "unit": "iter/sec",
            "range": "stddev: 0.07092252120517348",
            "extra": "mean: 137.0618448750065 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.642736310677247,
            "unit": "iter/sec",
            "range": "stddev: 0.04328226985605242",
            "extra": "mean: 56.68055013636449 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.64502513105607,
            "unit": "iter/sec",
            "range": "stddev: 0.0006292727008094665",
            "extra": "mean: 25.223845783784014 msec\nrounds: 37"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 124.37546845070581,
            "unit": "iter/sec",
            "range": "stddev: 0.00028389988024570467",
            "extra": "mean: 8.040170722221914 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 223.41159874145265,
            "unit": "iter/sec",
            "range": "stddev: 0.0002033462079438038",
            "extra": "mean: 4.476043346152628 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.9011046754652,
            "unit": "iter/sec",
            "range": "stddev: 0.00014947696915881565",
            "extra": "mean: 4.589237863155248 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 184.08570986154555,
            "unit": "iter/sec",
            "range": "stddev: 0.00014897374804745517",
            "extra": "mean: 5.432252187049823 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 94.17114833482908,
            "unit": "iter/sec",
            "range": "stddev: 0.000804443197003898",
            "extra": "mean: 10.618963638889293 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 186.78667529163465,
            "unit": "iter/sec",
            "range": "stddev: 0.0001484346574186857",
            "extra": "mean: 5.353700944880973 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 234.5511149035046,
            "unit": "iter/sec",
            "range": "stddev: 0.00013409726132737216",
            "extra": "mean: 4.26346300000068 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 231.41613258539638,
            "unit": "iter/sec",
            "range": "stddev: 0.00015047218730341767",
            "extra": "mean: 4.321219911628172 msec\nrounds: 215"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 195.9685229605287,
            "unit": "iter/sec",
            "range": "stddev: 0.0001577218353826654",
            "extra": "mean: 5.102860321100733 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 176.28402995726134,
            "unit": "iter/sec",
            "range": "stddev: 0.0009763293409936908",
            "extra": "mean: 5.67266360000076 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "66125a17c641803de80d493c5ecfd99ca5332d81",
          "message": "Merge pull request #78 from stnkvcmls/claude/route-display-animation-3wf86b\n\nfeat: animated route silhouette on activity detail",
          "timestamp": "2026-06-24T07:04:23-07:00",
          "tree_id": "d17c08d2ef2202e46cb086c233406ce443d8b21e",
          "url": "https://github.com/stnkvcmls/running-coach/commit/66125a17c641803de80d493c5ecfd99ca5332d81"
        },
        "date": 1782309922858,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 397.2018896858455,
            "unit": "iter/sec",
            "range": "stddev: 0.00018972370976385488",
            "extra": "mean: 2.5176113859652554 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 26.543047637224685,
            "unit": "iter/sec",
            "range": "stddev: 0.022240601262530465",
            "extra": "mean: 37.67464888235265 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.784999463456206,
            "unit": "iter/sec",
            "range": "stddev: 0.021834537869720276",
            "extra": "mean: 33.573947222222365 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 75.90195879690943,
            "unit": "iter/sec",
            "range": "stddev: 0.014080209069561107",
            "extra": "mean: 13.174890554217395 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 83.69735078771744,
            "unit": "iter/sec",
            "range": "stddev: 0.00014932302599836848",
            "extra": "mean: 11.947809465753721 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 177.79889121319658,
            "unit": "iter/sec",
            "range": "stddev: 0.00024148571120418135",
            "extra": "mean: 5.624332037036787 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 186.2720665376132,
            "unit": "iter/sec",
            "range": "stddev: 0.00008703481985311398",
            "extra": "mean: 5.368491468354832 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 201.75328295520083,
            "unit": "iter/sec",
            "range": "stddev: 0.00011728391830320324",
            "extra": "mean: 4.956548837037013 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 144.78257469490046,
            "unit": "iter/sec",
            "range": "stddev: 0.00009892922908303279",
            "extra": "mean: 6.906908528925491 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 192.95566562501293,
            "unit": "iter/sec",
            "range": "stddev: 0.00017314828338061975",
            "extra": "mean: 5.182537640244182 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 260.791352490128,
            "unit": "iter/sec",
            "range": "stddev: 0.006714746180261205",
            "extra": "mean: 3.8344829705879686 msec\nrounds: 238"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 153.68582814386284,
            "unit": "iter/sec",
            "range": "stddev: 0.00008601190626184705",
            "extra": "mean: 6.5067808273376775 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 225.08123781268506,
            "unit": "iter/sec",
            "range": "stddev: 0.00010195710963371965",
            "extra": "mean: 4.442840326087999 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 269.2606360347452,
            "unit": "iter/sec",
            "range": "stddev: 0.00009827732091383069",
            "extra": "mean: 3.7138737200002776 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 281.9740673080727,
            "unit": "iter/sec",
            "range": "stddev: 0.00009918925751891826",
            "extra": "mean: 3.5464254197086973 msec\nrounds: 274"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 240.45648732587196,
            "unit": "iter/sec",
            "range": "stddev: 0.00012493052924036685",
            "extra": "mean: 4.158756584698744 msec\nrounds: 183"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 122.52137186229564,
            "unit": "iter/sec",
            "range": "stddev: 0.000246650854402923",
            "extra": "mean: 8.161841357146418 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.702878564677153,
            "unit": "iter/sec",
            "range": "stddev: 0.0005580691371203368",
            "extra": "mean: 34.83971120689748 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 172.82907144793816,
            "unit": "iter/sec",
            "range": "stddev: 0.0000888114215057369",
            "extra": "mean: 5.786063603895674 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 179.96932074987677,
            "unit": "iter/sec",
            "range": "stddev: 0.009942958733598939",
            "extra": "mean: 5.556502607407238 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 137.907849158447,
            "unit": "iter/sec",
            "range": "stddev: 0.00012930625531461508",
            "extra": "mean: 7.251218883495646 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.605670237458929,
            "unit": "iter/sec",
            "range": "stddev: 0.008067893992512662",
            "extra": "mean: 131.4808516249979 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.17668109342321,
            "unit": "iter/sec",
            "range": "stddev: 0.02621281558617456",
            "extra": "mean: 45.09241016666662 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 35.13908153890316,
            "unit": "iter/sec",
            "range": "stddev: 0.0010731977652788354",
            "extra": "mean: 28.458342000000208 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 115.5551442867258,
            "unit": "iter/sec",
            "range": "stddev: 0.010927778466425762",
            "extra": "mean: 8.653876953489066 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 216.70842268810566,
            "unit": "iter/sec",
            "range": "stddev: 0.00010316123568654395",
            "extra": "mean: 4.614495309391989 msec\nrounds: 181"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 215.09289790193452,
            "unit": "iter/sec",
            "range": "stddev: 0.00009666073891760969",
            "extra": "mean: 4.649153969072105 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 180.4308093293943,
            "unit": "iter/sec",
            "range": "stddev: 0.00010074766042946204",
            "extra": "mean: 5.542290719177572 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 108.05665376622956,
            "unit": "iter/sec",
            "range": "stddev: 0.00011995588522858665",
            "extra": "mean: 9.25440465853594 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 181.9622275766987,
            "unit": "iter/sec",
            "range": "stddev: 0.00014656016261167188",
            "extra": "mean: 5.495646065216976 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.86964453197083,
            "unit": "iter/sec",
            "range": "stddev: 0.00008926366064181559",
            "extra": "mean: 4.312768072847574 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 227.69207783327477,
            "unit": "iter/sec",
            "range": "stddev: 0.0002481983544725078",
            "extra": "mean: 4.391896325581604 msec\nrounds: 215"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 194.2108399031289,
            "unit": "iter/sec",
            "range": "stddev: 0.00013058547030354682",
            "extra": "mean: 5.1490431764714755 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 206.0736195650391,
            "unit": "iter/sec",
            "range": "stddev: 0.00026485115020454377",
            "extra": "mean: 4.852634714286604 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "496538a6061b5097f42d4f061bb07e478b360eab",
          "message": "Merge pull request #81 from stnkvcmls/claude/p3-2-implementation-oof4vr\n\nP3-2: Move AI model catalog to config",
          "timestamp": "2026-06-24T07:28:16-07:00",
          "tree_id": "0df776d4523c43b779546489e08346a56bdd3d87",
          "url": "https://github.com/stnkvcmls/running-coach/commit/496538a6061b5097f42d4f061bb07e478b360eab"
        },
        "date": 1782311353096,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 378.72100222693757,
            "unit": "iter/sec",
            "range": "stddev: 0.000174471273573837",
            "extra": "mean: 2.6404661851860514 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 22.169993571758262,
            "unit": "iter/sec",
            "range": "stddev: 0.03204075498592134",
            "extra": "mean: 45.10601217647046 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 31.265518627957984,
            "unit": "iter/sec",
            "range": "stddev: 0.017459182348383652",
            "extra": "mean: 31.984116812499906 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 73.73246829122309,
            "unit": "iter/sec",
            "range": "stddev: 0.015360501757212834",
            "extra": "mean: 13.562546096385564 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 70.94251911704468,
            "unit": "iter/sec",
            "range": "stddev: 0.011628316260080223",
            "extra": "mean: 14.095918955882404 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 171.84784593578715,
            "unit": "iter/sec",
            "range": "stddev: 0.00012010733709343088",
            "extra": "mean: 5.819101162162143 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.2019754778282,
            "unit": "iter/sec",
            "range": "stddev: 0.00009051257174027802",
            "extra": "mean: 5.549328731543449 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 193.5670518963797,
            "unit": "iter/sec",
            "range": "stddev: 0.00034238283634416495",
            "extra": "mean: 5.1661684682541935 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.17602352128716,
            "unit": "iter/sec",
            "range": "stddev: 0.000878979182403481",
            "extra": "mean: 7.289903689654764 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 186.4543765231996,
            "unit": "iter/sec",
            "range": "stddev: 0.000129595426355756",
            "extra": "mean: 5.363242304347707 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.6866335915304,
            "unit": "iter/sec",
            "range": "stddev: 0.0001163152556448988",
            "extra": "mean: 3.537485969163139 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 135.2527316409658,
            "unit": "iter/sec",
            "range": "stddev: 0.008980606788871056",
            "extra": "mean: 7.393566014286077 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 217.29411819357824,
            "unit": "iter/sec",
            "range": "stddev: 0.00018434526719570272",
            "extra": "mean: 4.602057378788053 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 257.86788257848764,
            "unit": "iter/sec",
            "range": "stddev: 0.0001675322625383881",
            "extra": "mean: 3.8779548271027067 msec\nrounds: 214"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 273.7244844782654,
            "unit": "iter/sec",
            "range": "stddev: 0.00009925085698672453",
            "extra": "mean: 3.65330855186761 msec\nrounds: 241"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 233.2172659587634,
            "unit": "iter/sec",
            "range": "stddev: 0.00010533177922872919",
            "extra": "mean: 4.287847196428485 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 57.05084103252779,
            "unit": "iter/sec",
            "range": "stddev: 0.03240957193853772",
            "extra": "mean: 17.528225384615197 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.61299197270922,
            "unit": "iter/sec",
            "range": "stddev: 0.0009149136275124589",
            "extra": "mean: 34.94915879310314 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 164.5967679409984,
            "unit": "iter/sec",
            "range": "stddev: 0.00016984306499585373",
            "extra": "mean: 6.075453439999876 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 205.27156292795644,
            "unit": "iter/sec",
            "range": "stddev: 0.00015049928591945633",
            "extra": "mean: 4.871595391666439 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 132.7320318684764,
            "unit": "iter/sec",
            "range": "stddev: 0.00020645212753263493",
            "extra": "mean: 7.533976432990159 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.9944882960100125,
            "unit": "iter/sec",
            "range": "stddev: 0.009012497411385097",
            "extra": "mean: 142.96971524999867 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.306392172402678,
            "unit": "iter/sec",
            "range": "stddev: 0.02812185960110726",
            "extra": "mean: 46.93427173912908 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 29.397507374140584,
            "unit": "iter/sec",
            "range": "stddev: 0.022701849927438775",
            "extra": "mean: 34.01648946875157 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 127.9452874431883,
            "unit": "iter/sec",
            "range": "stddev: 0.0001365631382191417",
            "extra": "mean: 7.8158408174590335 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 212.36101711745079,
            "unit": "iter/sec",
            "range": "stddev: 0.00010241842781878115",
            "extra": "mean: 4.708962188888598 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.25613171576964,
            "unit": "iter/sec",
            "range": "stddev: 0.00013063318947052486",
            "extra": "mean: 4.756103861702493 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 174.49617465282705,
            "unit": "iter/sec",
            "range": "stddev: 0.0003586362375775523",
            "extra": "mean: 5.7307846546755155 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 106.43899395644407,
            "unit": "iter/sec",
            "range": "stddev: 0.00015167249006330574",
            "extra": "mean: 9.39505309876576 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 176.2996421554174,
            "unit": "iter/sec",
            "range": "stddev: 0.00013039377497325795",
            "extra": "mean: 5.672161257811559 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 223.8656516732629,
            "unit": "iter/sec",
            "range": "stddev: 0.0001404042212860554",
            "extra": "mean: 4.466964862745104 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 221.55604482580438,
            "unit": "iter/sec",
            "range": "stddev: 0.00018908824622979243",
            "extra": "mean: 4.513530654450152 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 185.14558567301307,
            "unit": "iter/sec",
            "range": "stddev: 0.00022049995942175453",
            "extra": "mean: 5.401154968750414 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 195.00691806538526,
            "unit": "iter/sec",
            "range": "stddev: 0.0005317639802475778",
            "extra": "mean: 5.128023200001053 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9254a809a187c387c7094d7cb71c3f9c80cb4827",
          "message": "Merge pull request #82 from stnkvcmls/claude/training-stats-help-icons-kp3ibj\n\nAdd help icons and explainer pages for training stats",
          "timestamp": "2026-06-24T13:06:39-07:00",
          "tree_id": "e984158724fd3a332b1eca3217d003f2e956c364",
          "url": "https://github.com/stnkvcmls/running-coach/commit/9254a809a187c387c7094d7cb71c3f9c80cb4827"
        },
        "date": 1782331664308,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 345.9640582552204,
            "unit": "iter/sec",
            "range": "stddev: 0.00030961251060157444",
            "extra": "mean: 2.8904736666671087 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 23.057289389604442,
            "unit": "iter/sec",
            "range": "stddev: 0.03222518199321218",
            "extra": "mean: 43.37023242857236 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 26.65176431044264,
            "unit": "iter/sec",
            "range": "stddev: 0.025789009793738493",
            "extra": "mean: 37.520968156250056 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 67.79847653037187,
            "unit": "iter/sec",
            "range": "stddev: 0.019005201311024504",
            "extra": "mean: 14.749593961038745 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.1961831328264,
            "unit": "iter/sec",
            "range": "stddev: 0.0007672727432262482",
            "extra": "mean: 12.954008338461055 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 173.0690505098626,
            "unit": "iter/sec",
            "range": "stddev: 0.00011971589001971175",
            "extra": "mean: 5.778040597403137 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.80891828523113,
            "unit": "iter/sec",
            "range": "stddev: 0.00012278425044038078",
            "extra": "mean: 5.561459406666908 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 163.500008743344,
            "unit": "iter/sec",
            "range": "stddev: 0.010340892652981663",
            "extra": "mean: 6.116207623999344 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 140.2716791395682,
            "unit": "iter/sec",
            "range": "stddev: 0.0000806392596862011",
            "extra": "mean: 7.129022808695511 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 185.24094148179935,
            "unit": "iter/sec",
            "range": "stddev: 0.00017033407731217572",
            "extra": "mean: 5.3983746357619 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 285.27400189828364,
            "unit": "iter/sec",
            "range": "stddev: 0.00010426614560141651",
            "extra": "mean: 3.5054018008853 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 134.1661497142882,
            "unit": "iter/sec",
            "range": "stddev: 0.009292344157476536",
            "extra": "mean: 7.453444867647593 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 218.96741463290894,
            "unit": "iter/sec",
            "range": "stddev: 0.00012425026492866043",
            "extra": "mean: 4.566889560606377 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.6621100798462,
            "unit": "iter/sec",
            "range": "stddev: 0.00012520130168512203",
            "extra": "mean: 3.851158721973335 msec\nrounds: 223"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 272.50231289092767,
            "unit": "iter/sec",
            "range": "stddev: 0.00014361602093663546",
            "extra": "mean: 3.669693623482242 msec\nrounds: 247"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.2644561423724,
            "unit": "iter/sec",
            "range": "stddev: 0.00010091964605171713",
            "extra": "mean: 4.268680005780552 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 116.95394844711569,
            "unit": "iter/sec",
            "range": "stddev: 0.000252871512601698",
            "extra": "mean: 8.550374000003776 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.893713175864224,
            "unit": "iter/sec",
            "range": "stddev: 0.0004938120150886151",
            "extra": "mean: 34.60960500000151 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.54625150393434,
            "unit": "iter/sec",
            "range": "stddev: 0.00010650782171792924",
            "extra": "mean: 5.968501181159031 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 207.69341992128565,
            "unit": "iter/sec",
            "range": "stddev: 0.00011556389130894544",
            "extra": "mean: 4.814789030769454 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 113.52713102713268,
            "unit": "iter/sec",
            "range": "stddev: 0.013278149609909399",
            "extra": "mean: 8.808467112244761 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.213511180967666,
            "unit": "iter/sec",
            "range": "stddev: 0.005633190817910222",
            "extra": "mean: 138.628744714284 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.455472219681347,
            "unit": "iter/sec",
            "range": "stddev: 0.02764863387908226",
            "extra": "mean: 46.608156173914864 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.378344582822876,
            "unit": "iter/sec",
            "range": "stddev: 0.001608624825001901",
            "extra": "mean: 30.884840250001933 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 127.38278329543765,
            "unit": "iter/sec",
            "range": "stddev: 0.00008717464199610716",
            "extra": "mean: 7.850354452380819 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.38605850102164,
            "unit": "iter/sec",
            "range": "stddev: 0.00014597451788346763",
            "extra": "mean: 4.753166664772818 msec\nrounds: 176"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.39449762882344,
            "unit": "iter/sec",
            "range": "stddev: 0.00012576142756767",
            "extra": "mean: 4.752976010637851 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.62565093009087,
            "unit": "iter/sec",
            "range": "stddev: 0.00010590988745763892",
            "extra": "mean: 5.629817510949337 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 86.30339823529603,
            "unit": "iter/sec",
            "range": "stddev: 0.01643406549028379",
            "extra": "mean: 11.587029253165884 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 177.69111307760258,
            "unit": "iter/sec",
            "range": "stddev: 0.00012203292043491756",
            "extra": "mean: 5.627743462686694 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 225.87919063250806,
            "unit": "iter/sec",
            "range": "stddev: 0.00010374083815667688",
            "extra": "mean: 4.4271453124999915 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 225.80656245907778,
            "unit": "iter/sec",
            "range": "stddev: 0.00012032331625697991",
            "extra": "mean: 4.428569254630175 msec\nrounds: 216"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 182.09420831222357,
            "unit": "iter/sec",
            "range": "stddev: 0.0005304862263149936",
            "extra": "mean: 5.4916628555553695 msec\nrounds: 90"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 200.3605769085483,
            "unit": "iter/sec",
            "range": "stddev: 0.00012487396875066666",
            "extra": "mean: 4.991001800001982 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "203a947ab18e951a258c04328d1e42fb696db6d7",
          "message": "Merge pull request #83 from stnkvcmls/claude/p1-3-improvements-3t851k\n\nfeat(p1-3): push structured workouts to Garmin device",
          "timestamp": "2026-06-24T17:14:03-07:00",
          "tree_id": "ffcf1bf9bd20a6e1e16c08d93d2a9b1cf7c6ae63",
          "url": "https://github.com/stnkvcmls/running-coach/commit/203a947ab18e951a258c04328d1e42fb696db6d7"
        },
        "date": 1782346506043,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.0698625194557,
            "unit": "iter/sec",
            "range": "stddev: 0.0001971292469465891",
            "extra": "mean: 2.6380361481484833 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 24.76905093639397,
            "unit": "iter/sec",
            "range": "stddev: 0.026339381081559043",
            "extra": "mean: 40.37296392857215 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 28.521281375977924,
            "unit": "iter/sec",
            "range": "stddev: 0.025478305468658705",
            "extra": "mean: 35.06153832352886 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 73.22769535292834,
            "unit": "iter/sec",
            "range": "stddev: 0.016674929277386657",
            "extra": "mean: 13.656035399999933 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 81.33700988119854,
            "unit": "iter/sec",
            "range": "stddev: 0.0004322011505264981",
            "extra": "mean: 12.294526212121735 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 174.60280964193151,
            "unit": "iter/sec",
            "range": "stddev: 0.0000981151089521607",
            "extra": "mean: 5.727284698629765 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.99116647420328,
            "unit": "iter/sec",
            "range": "stddev: 0.00012669814360332597",
            "extra": "mean: 5.52513152702693 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.84571939299045,
            "unit": "iter/sec",
            "range": "stddev: 0.00013030722496870585",
            "extra": "mean: 5.080120629921147 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.66845507279734,
            "unit": "iter/sec",
            "range": "stddev: 0.00012196951173964192",
            "extra": "mean: 7.058734419642982 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 163.78703166180992,
            "unit": "iter/sec",
            "range": "stddev: 0.010061723791976944",
            "extra": "mean: 6.105489487499938 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 285.086928321472,
            "unit": "iter/sec",
            "range": "stddev: 0.00011322947094893982",
            "extra": "mean: 3.5077020398226466 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 149.49208456945468,
            "unit": "iter/sec",
            "range": "stddev: 0.00016100635132021258",
            "extra": "mean: 6.6893173834591595 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.68913945812966,
            "unit": "iter/sec",
            "range": "stddev: 0.00037798649066163813",
            "extra": "mean: 4.636302052631275 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 226.4528350545928,
            "unit": "iter/sec",
            "range": "stddev: 0.008510694477936747",
            "extra": "mean: 4.415930583332825 msec\nrounds: 204"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 273.4049259554591,
            "unit": "iter/sec",
            "range": "stddev: 0.00011670724342662275",
            "extra": "mean: 3.6575785769233433 msec\nrounds: 260"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 235.22394368368873,
            "unit": "iter/sec",
            "range": "stddev: 0.00011319459866145416",
            "extra": "mean: 4.25126789534965 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 117.94356467563614,
            "unit": "iter/sec",
            "range": "stddev: 0.00037390218513173894",
            "extra": "mean: 8.478631307695013 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.81054252164158,
            "unit": "iter/sec",
            "range": "stddev: 0.0008688103593809442",
            "extra": "mean: 34.70951646428842 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.8982383269972,
            "unit": "iter/sec",
            "range": "stddev: 0.00020953231061747972",
            "extra": "mean: 5.955988639097025 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 210.59841001991472,
            "unit": "iter/sec",
            "range": "stddev: 0.00011340093685082605",
            "extra": "mean: 4.748373930769171 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 114.8960101329121,
            "unit": "iter/sec",
            "range": "stddev: 0.00029580670205373125",
            "extra": "mean: 8.70352241860441 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.94741418831872,
            "unit": "iter/sec",
            "range": "stddev: 0.009559062504638548",
            "extra": "mean: 143.93844571428968 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.215270561734656,
            "unit": "iter/sec",
            "range": "stddev: 0.02796260502114583",
            "extra": "mean: 47.13585891304493 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.781036053824174,
            "unit": "iter/sec",
            "range": "stddev: 0.0017439841574037774",
            "extra": "mean: 30.505442181817244 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 113.90263223799943,
            "unit": "iter/sec",
            "range": "stddev: 0.011735925161743628",
            "extra": "mean: 8.779428362204142 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 214.77812390306457,
            "unit": "iter/sec",
            "range": "stddev: 0.00012350498236126056",
            "extra": "mean: 4.655967664804299 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 212.74294996114224,
            "unit": "iter/sec",
            "range": "stddev: 0.00011087513818961879",
            "extra": "mean: 4.700508290322435 msec\nrounds: 93"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.81676254242223,
            "unit": "iter/sec",
            "range": "stddev: 0.00016024536318762157",
            "extra": "mean: 5.62376676811573 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 107.70494748177813,
            "unit": "iter/sec",
            "range": "stddev: 0.00026647890865205286",
            "extra": "mean: 9.284624554217281 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 179.73292023378175,
            "unit": "iter/sec",
            "range": "stddev: 0.0001568435383699318",
            "extra": "mean: 5.563811007461974 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.4237453290768,
            "unit": "iter/sec",
            "range": "stddev: 0.00013551279722975225",
            "extra": "mean: 4.397078231883937 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 224.85400245017655,
            "unit": "iter/sec",
            "range": "stddev: 0.0001342317389166819",
            "extra": "mean: 4.447330219178915 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 187.33306096098417,
            "unit": "iter/sec",
            "range": "stddev: 0.0001595379888723134",
            "extra": "mean: 5.338086053098069 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 183.7561476536912,
            "unit": "iter/sec",
            "range": "stddev: 0.0008494016280634115",
            "extra": "mean: 5.441994800003158 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6ecf58aa0fc303bd5dc06143421a95b329b91c20",
          "message": "Merge pull request #84 from stnkvcmls/claude/codebase-state-docs-z9w4il\n\ndocs: refresh CURRENT_STATE.md to reflect current codebase",
          "timestamp": "2026-06-25T06:09:23-07:00",
          "tree_id": "b72591aff3e46fe2ed1d6cac576474102def3339",
          "url": "https://github.com/stnkvcmls/running-coach/commit/6ecf58aa0fc303bd5dc06143421a95b329b91c20"
        },
        "date": 1782393026237,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 294.87707177158586,
            "unit": "iter/sec",
            "range": "stddev: 0.0006956026982702224",
            "extra": "mean: 3.391243659576924 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 15.729993709974137,
            "unit": "iter/sec",
            "range": "stddev: 0.05186762577541006",
            "extra": "mean: 63.57281626666615 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 24.21652297821921,
            "unit": "iter/sec",
            "range": "stddev: 0.027534774470333846",
            "extra": "mean: 41.294119758621775 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 58.12547446884364,
            "unit": "iter/sec",
            "range": "stddev: 0.01865637585490158",
            "extra": "mean: 17.20416063934272 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 62.44564482711567,
            "unit": "iter/sec",
            "range": "stddev: 0.0005944154627735321",
            "extra": "mean: 16.013927036361896 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 129.84746091619505,
            "unit": "iter/sec",
            "range": "stddev: 0.0010954187891217574",
            "extra": "mean: 7.701344276923605 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 131.3594047170253,
            "unit": "iter/sec",
            "range": "stddev: 0.0010607387113299976",
            "extra": "mean: 7.612701977100169 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 132.2826441316594,
            "unit": "iter/sec",
            "range": "stddev: 0.0010977552480471349",
            "extra": "mean: 7.55957069473688 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 78.41418132605634,
            "unit": "iter/sec",
            "range": "stddev: 0.0016728078107478247",
            "extra": "mean: 12.752795260870865 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 105.04375664345274,
            "unit": "iter/sec",
            "range": "stddev: 0.0022168399343407887",
            "extra": "mean: 9.519842320512906 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 152.7938029925179,
            "unit": "iter/sec",
            "range": "stddev: 0.001333367528258768",
            "extra": "mean: 6.544768049584895 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 83.11047558571555,
            "unit": "iter/sec",
            "range": "stddev: 0.018456360009415657",
            "extra": "mean: 12.032177567900634 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 112.09183538194651,
            "unit": "iter/sec",
            "range": "stddev: 0.0017391715445414908",
            "extra": "mean: 8.921256366197923 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 157.54055812488224,
            "unit": "iter/sec",
            "range": "stddev: 0.001202313487184857",
            "extra": "mean: 6.347571773912982 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 170.2841631810751,
            "unit": "iter/sec",
            "range": "stddev: 0.0012979944079847031",
            "extra": "mean: 5.872536713450152 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 131.57602635794333,
            "unit": "iter/sec",
            "range": "stddev: 0.0010083430596903962",
            "extra": "mean: 7.600168721310752 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 76.5754676747541,
            "unit": "iter/sec",
            "range": "stddev: 0.0007995308210521367",
            "extra": "mean: 13.059012636362738 msec\nrounds: 11"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 26.088901113391977,
            "unit": "iter/sec",
            "range": "stddev: 0.0007967885446891732",
            "extra": "mean: 38.330476076919894 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 115.41103070974145,
            "unit": "iter/sec",
            "range": "stddev: 0.0010879694716224866",
            "extra": "mean: 8.664683036364162 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 148.33347446244153,
            "unit": "iter/sec",
            "range": "stddev: 0.0010474199040612273",
            "extra": "mean: 6.741566619564371 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 74.3309076140691,
            "unit": "iter/sec",
            "range": "stddev: 0.0015512418028300772",
            "extra": "mean: 13.453353821428696 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 5.44194465149393,
            "unit": "iter/sec",
            "range": "stddev: 0.08257584446847446",
            "extra": "mean: 183.75784099999595 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 15.779121832856395,
            "unit": "iter/sec",
            "range": "stddev: 0.04927172133267852",
            "extra": "mean: 63.37488299999876 msec\nrounds: 20"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 28.147313156231572,
            "unit": "iter/sec",
            "range": "stddev: 0.0018897569245448905",
            "extra": "mean: 35.52736967999408 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 94.02711864853487,
            "unit": "iter/sec",
            "range": "stddev: 0.0011972141712752128",
            "extra": "mean: 10.6352296483519 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 153.55362777311586,
            "unit": "iter/sec",
            "range": "stddev: 0.0016217689360091294",
            "extra": "mean: 6.512382771428602 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 181.21624606183636,
            "unit": "iter/sec",
            "range": "stddev: 0.0010558710404236183",
            "extra": "mean: 5.51826903896227 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 128.32235070677226,
            "unit": "iter/sec",
            "range": "stddev: 0.0013990086505212404",
            "extra": "mean: 7.792874697916711 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 75.10143222544087,
            "unit": "iter/sec",
            "range": "stddev: 0.0011560058827526096",
            "extra": "mean: 13.315325292308426 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 142.18860671320343,
            "unit": "iter/sec",
            "range": "stddev: 0.0012616548957590493",
            "extra": "mean: 7.032912292452624 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 177.70201585897843,
            "unit": "iter/sec",
            "range": "stddev: 0.0011822496861262552",
            "extra": "mean: 5.627398176470797 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 137.29094663699706,
            "unit": "iter/sec",
            "range": "stddev: 0.016044713704341247",
            "extra": "mean: 7.283801477777274 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 149.65169420843276,
            "unit": "iter/sec",
            "range": "stddev: 0.0017524952740247232",
            "extra": "mean: 6.682182953486742 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 185.53437265443998,
            "unit": "iter/sec",
            "range": "stddev: 0.0007128413783734337",
            "extra": "mean: 5.389836857144052 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2dc77853fca92175d2e0d1151450528a435af3af",
          "message": "Merge pull request #85 from stnkvcmls/claude/running-coach-research-3cy0f3\n\ndocs: v3 improvement plan — conversational coach & execution focus",
          "timestamp": "2026-06-25T06:59:52-07:00",
          "tree_id": "4fb07a4e200f6432cdee9e9786ba35fc24585309",
          "url": "https://github.com/stnkvcmls/running-coach/commit/2dc77853fca92175d2e0d1151450528a435af3af"
        },
        "date": 1782396050369,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 387.0569142678623,
            "unit": "iter/sec",
            "range": "stddev: 0.0001956436631718797",
            "extra": "mean: 2.5835993703705062 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 21.162523650365284,
            "unit": "iter/sec",
            "range": "stddev: 0.036091345479969554",
            "extra": "mean: 47.253343529411204 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.56800390959928,
            "unit": "iter/sec",
            "range": "stddev: 0.018796322723987915",
            "extra": "mean: 33.820341848485384 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 88.38300284114078,
            "unit": "iter/sec",
            "range": "stddev: 0.00032420805516886935",
            "extra": "mean: 11.314392675675386 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.28549237698508,
            "unit": "iter/sec",
            "range": "stddev: 0.0003285778634325469",
            "extra": "mean: 12.939038999999838 msec\nrounds: 67"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 174.21517340748295,
            "unit": "iter/sec",
            "range": "stddev: 0.00015445978909234888",
            "extra": "mean: 5.740028152777693 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.01074406133225,
            "unit": "iter/sec",
            "range": "stddev: 0.00010246576706053148",
            "extra": "mean: 5.494181154839022 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 191.48052456635054,
            "unit": "iter/sec",
            "range": "stddev: 0.0003982081788450556",
            "extra": "mean: 5.222463236220594 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 139.967807404293,
            "unit": "iter/sec",
            "range": "stddev: 0.00023415803272264777",
            "extra": "mean: 7.144500000000203 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 163.98073527194387,
            "unit": "iter/sec",
            "range": "stddev: 0.009254439671516465",
            "extra": "mean: 6.098277327160479 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 287.499657862679,
            "unit": "iter/sec",
            "range": "stddev: 0.00013065115700938043",
            "extra": "mean: 3.4782650088496414 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 133.5811787787315,
            "unit": "iter/sec",
            "range": "stddev: 0.010070848390101235",
            "extra": "mean: 7.48608456028401 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 217.67496865232258,
            "unit": "iter/sec",
            "range": "stddev: 0.0001363824760856315",
            "extra": "mean: 4.594005485294141 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 262.1636763119975,
            "unit": "iter/sec",
            "range": "stddev: 0.00011786634838264665",
            "extra": "mean: 3.8144109590907376 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.3377104035863,
            "unit": "iter/sec",
            "range": "stddev: 0.00011636963727401264",
            "extra": "mean: 3.618760532319378 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.76133845886184,
            "unit": "iter/sec",
            "range": "stddev: 0.0001142855941134235",
            "extra": "mean: 4.259645163742469 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 114.92391532908256,
            "unit": "iter/sec",
            "range": "stddev: 0.00035933436018629393",
            "extra": "mean: 8.701409076922918 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.224212125050133,
            "unit": "iter/sec",
            "range": "stddev: 0.0005674988600091115",
            "extra": "mean: 35.43057271428524 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 168.5806233259388,
            "unit": "iter/sec",
            "range": "stddev: 0.00015149327891056822",
            "extra": "mean: 5.93187983453217 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 209.82079498039025,
            "unit": "iter/sec",
            "range": "stddev: 0.00013172410357737362",
            "extra": "mean: 4.765971838460814 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 113.76576646629809,
            "unit": "iter/sec",
            "range": "stddev: 0.00023614022668175998",
            "extra": "mean: 8.789990443181688 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.6650570831521385,
            "unit": "iter/sec",
            "range": "stddev: 0.045502793910759134",
            "extra": "mean: 150.03622437500042 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.1189876976487,
            "unit": "iter/sec",
            "range": "stddev: 0.026337684868873366",
            "extra": "mean: 47.350754416668174 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.72303249803308,
            "unit": "iter/sec",
            "range": "stddev: 0.0014328156675498943",
            "extra": "mean: 29.653323735293547 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 110.92597958248268,
            "unit": "iter/sec",
            "range": "stddev: 0.01241721228943918",
            "extra": "mean: 9.01502068103367 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.78646397895352,
            "unit": "iter/sec",
            "range": "stddev: 0.00021429201558778127",
            "extra": "mean: 4.744137650602874 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 211.64828952554208,
            "unit": "iter/sec",
            "range": "stddev: 0.00013831676543472107",
            "extra": "mean: 4.724819663044422 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 176.743824854261,
            "unit": "iter/sec",
            "range": "stddev: 0.0001388358567889431",
            "extra": "mean: 5.657906299270018 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 101.84521812561019,
            "unit": "iter/sec",
            "range": "stddev: 0.0003770361692644542",
            "extra": "mean: 9.81882132911391 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 179.08096200436106,
            "unit": "iter/sec",
            "range": "stddev: 0.00013504102551038446",
            "extra": "mean: 5.584066495999991 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 228.26424261466178,
            "unit": "iter/sec",
            "range": "stddev: 0.00011268396760219911",
            "extra": "mean: 4.3808876438353215 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 226.26528204367258,
            "unit": "iter/sec",
            "range": "stddev: 0.00013494528433268105",
            "extra": "mean: 4.419590981735259 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 190.71932349527773,
            "unit": "iter/sec",
            "range": "stddev: 0.00026123110527700717",
            "extra": "mean: 5.243307189188726 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 200.45117550569898,
            "unit": "iter/sec",
            "range": "stddev: 0.0004911637444337182",
            "extra": "mean: 4.988746000003224 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "262e682842145771d1c78776242474c7eaf374fa",
          "message": "Merge pull request #87 from stnkvcmls/claude/zone-duration-calculation-miocvg\n\nfix: HR zone chart shows non-zero time for zones runner never reached",
          "timestamp": "2026-06-25T13:26:03-07:00",
          "tree_id": "540c13a124cfcc2313aa220ddb6b747d5c4d1b06",
          "url": "https://github.com/stnkvcmls/running-coach/commit/262e682842145771d1c78776242474c7eaf374fa"
        },
        "date": 1782419220489,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 388.50654040038086,
            "unit": "iter/sec",
            "range": "stddev: 0.00025204697884088207",
            "extra": "mean: 2.573959241379659 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 24.59707498905439,
            "unit": "iter/sec",
            "range": "stddev: 0.02272545160914275",
            "extra": "mean: 40.65524052941239 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 26.817194911506764,
            "unit": "iter/sec",
            "range": "stddev: 0.02373820246734097",
            "extra": "mean: 37.289507843749846 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 83.38988167990209,
            "unit": "iter/sec",
            "range": "stddev: 0.00024305021988568732",
            "extra": "mean: 11.991862559999428 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 78.79011943637835,
            "unit": "iter/sec",
            "range": "stddev: 0.00033288561089699965",
            "extra": "mean: 12.691946746031812 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 135.00347641842373,
            "unit": "iter/sec",
            "range": "stddev: 0.010929824362460223",
            "extra": "mean: 7.407216662337233 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 172.11502876265598,
            "unit": "iter/sec",
            "range": "stddev: 0.00029528294218715963",
            "extra": "mean: 5.810067878377924 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 192.53988172896652,
            "unit": "iter/sec",
            "range": "stddev: 0.0002450962657078999",
            "extra": "mean: 5.193729169355544 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 133.92973429089537,
            "unit": "iter/sec",
            "range": "stddev: 0.00030915473661501623",
            "extra": "mean: 7.4666018363629405 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 182.19895153362694,
            "unit": "iter/sec",
            "range": "stddev: 0.0002871444553737184",
            "extra": "mean: 5.488505787671552 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 297.68440037024806,
            "unit": "iter/sec",
            "range": "stddev: 0.000168439202932665",
            "extra": "mean: 3.3592623555558827 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 125.22085229340246,
            "unit": "iter/sec",
            "range": "stddev: 0.009011067896607609",
            "extra": "mean: 7.985890382353573 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.84236205926095,
            "unit": "iter/sec",
            "range": "stddev: 0.00023899206170256072",
            "extra": "mean: 4.633010825397858 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 266.47397458229284,
            "unit": "iter/sec",
            "range": "stddev: 0.00018380924658146388",
            "extra": "mean: 3.7527116918923684 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 279.49711436305205,
            "unit": "iter/sec",
            "range": "stddev: 0.0002469400687483675",
            "extra": "mean: 3.5778544700860584 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 199.64987294185948,
            "unit": "iter/sec",
            "range": "stddev: 0.00851314941940486",
            "extra": "mean: 5.008768526946232 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 110.0027746628546,
            "unit": "iter/sec",
            "range": "stddev: 0.00043260052860712633",
            "extra": "mean: 9.090679785713414 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.359487587164995,
            "unit": "iter/sec",
            "range": "stddev: 0.00027752888671700584",
            "extra": "mean: 35.2615680000009 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 150.71038518689525,
            "unit": "iter/sec",
            "range": "stddev: 0.0003449647093929994",
            "extra": "mean: 6.635242811966174 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 201.55616405864433,
            "unit": "iter/sec",
            "range": "stddev: 0.00027776446742809694",
            "extra": "mean: 4.9613962672411365 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 108.02755083728711,
            "unit": "iter/sec",
            "range": "stddev: 0.0003763248340563647",
            "extra": "mean: 9.256897821429058 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.574474878198535,
            "unit": "iter/sec",
            "range": "stddev: 0.004605879489310037",
            "extra": "mean: 116.6252177777791 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.731296446080798,
            "unit": "iter/sec",
            "range": "stddev: 0.02538061850860019",
            "extra": "mean: 48.236250086957185 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.25506498415835,
            "unit": "iter/sec",
            "range": "stddev: 0.0010857567915909317",
            "extra": "mean: 26.841987805556673 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 100.14284919641852,
            "unit": "iter/sec",
            "range": "stddev: 0.011924051182099096",
            "extra": "mean: 9.98573545714299 msec\nrounds: 105"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 199.7935046863088,
            "unit": "iter/sec",
            "range": "stddev: 0.000444316147991586",
            "extra": "mean: 5.00516771839043 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 176.89554728533972,
            "unit": "iter/sec",
            "range": "stddev: 0.00036860351812929203",
            "extra": "mean: 5.653053541177942 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 162.19895710330323,
            "unit": "iter/sec",
            "range": "stddev: 0.000613649695422189",
            "extra": "mean: 6.165267754237827 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 100.03291293430874,
            "unit": "iter/sec",
            "range": "stddev: 0.00048772230718472346",
            "extra": "mean: 9.996709789473956 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 174.93386028078308,
            "unit": "iter/sec",
            "range": "stddev: 0.0002980500478610023",
            "extra": "mean: 5.716446195121509 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.5740031331353,
            "unit": "iter/sec",
            "range": "stddev: 0.00020323889865438117",
            "extra": "mean: 4.318274013793704 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 230.6237637423817,
            "unit": "iter/sec",
            "range": "stddev: 0.0002160208376010382",
            "extra": "mean: 4.336066603773972 msec\nrounds: 212"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 179.42678136833132,
            "unit": "iter/sec",
            "range": "stddev: 0.0006251880991950425",
            "extra": "mean: 5.5733040094342305 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 192.24219792580962,
            "unit": "iter/sec",
            "range": "stddev: 0.0006970333422735512",
            "extra": "mean: 5.201771571431583 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c2a602dd08b0f9c9e34f245c08d97d25795f9c49",
          "message": "Merge pull request #86 from stnkvcmls/claude/readme-documentation-vg8y3p\n\ndocs: add comprehensive README",
          "timestamp": "2026-06-25T13:34:20-07:00",
          "tree_id": "f5503ba98fab6e20faafdf6b3a214e59d59b00a4",
          "url": "https://github.com/stnkvcmls/running-coach/commit/c2a602dd08b0f9c9e34f245c08d97d25795f9c49"
        },
        "date": 1782419715437,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 543.5687847666628,
            "unit": "iter/sec",
            "range": "stddev: 0.00014196478581796583",
            "extra": "mean: 1.8396935733336288 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 27.4631748691209,
            "unit": "iter/sec",
            "range": "stddev: 0.03292915281896805",
            "extra": "mean: 36.412396045454386 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 34.37494426214869,
            "unit": "iter/sec",
            "range": "stddev: 0.024848807804820967",
            "extra": "mean: 29.09095626086966 msec\nrounds: 46"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 104.30442785918991,
            "unit": "iter/sec",
            "range": "stddev: 0.010888891375754488",
            "extra": "mean: 9.587320696969753 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 104.58682255978772,
            "unit": "iter/sec",
            "range": "stddev: 0.00014924979928860154",
            "extra": "mean: 9.561433988764154 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 182.44200828121006,
            "unit": "iter/sec",
            "range": "stddev: 0.012364569689447295",
            "extra": "mean: 5.481193774509614 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 239.8900173571838,
            "unit": "iter/sec",
            "range": "stddev: 0.00007438762343893559",
            "extra": "mean: 4.168576962963206 msec\nrounds: 189"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 254.73966605309445,
            "unit": "iter/sec",
            "range": "stddev: 0.00010443907907967031",
            "extra": "mean: 3.925576316770289 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 178.14461874036087,
            "unit": "iter/sec",
            "range": "stddev: 0.00033364704666190813",
            "extra": "mean: 5.613416824324414 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 239.21487356933395,
            "unit": "iter/sec",
            "range": "stddev: 0.00013118947611051409",
            "extra": "mean: 4.180342071038323 msec\nrounds: 183"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 383.2380970363973,
            "unit": "iter/sec",
            "range": "stddev: 0.00008791507557691489",
            "extra": "mean: 2.609343924137654 msec\nrounds: 290"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 144.73810891304987,
            "unit": "iter/sec",
            "range": "stddev: 0.01602793324919582",
            "extra": "mean: 6.909030437869968 msec\nrounds: 169"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 294.1255540567648,
            "unit": "iter/sec",
            "range": "stddev: 0.00012384751255753703",
            "extra": "mean: 3.399908597561043 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 348.32304847059333,
            "unit": "iter/sec",
            "range": "stddev: 0.00010259031804372449",
            "extra": "mean: 2.8708981630436767 msec\nrounds: 276"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 360.09683889056356,
            "unit": "iter/sec",
            "range": "stddev: 0.00009089548130618271",
            "extra": "mean: 2.777030765060141 msec\nrounds: 332"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 293.1568665623798,
            "unit": "iter/sec",
            "range": "stddev: 0.0006732195275242448",
            "extra": "mean: 3.4111430229358572 msec\nrounds: 218"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 144.25250046450387,
            "unit": "iter/sec",
            "range": "stddev: 0.00021366696654871256",
            "extra": "mean: 6.932288846154659 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 36.23776580186141,
            "unit": "iter/sec",
            "range": "stddev: 0.000794135842264763",
            "extra": "mean: 27.59552024999934 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 206.78095025069837,
            "unit": "iter/sec",
            "range": "stddev: 0.00010216066947068085",
            "extra": "mean: 4.836035421965195 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 266.0308666050438,
            "unit": "iter/sec",
            "range": "stddev: 0.00022973547032616542",
            "extra": "mean: 3.7589623067485074 msec\nrounds: 163"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 137.93438653793004,
            "unit": "iter/sec",
            "range": "stddev: 0.00017233396811719952",
            "extra": "mean: 7.249823811881846 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.965088499946772,
            "unit": "iter/sec",
            "range": "stddev: 0.04513583833004385",
            "extra": "mean: 100.35033808333378 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.746271484867425,
            "unit": "iter/sec",
            "range": "stddev: 0.043544013301647796",
            "extra": "mean: 45.9848945000006 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 53.23548622572854,
            "unit": "iter/sec",
            "range": "stddev: 0.0006029415477452268",
            "extra": "mean: 18.784462599999756 msec\nrounds: 50"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 162.9919881663496,
            "unit": "iter/sec",
            "range": "stddev: 0.00014397519972703934",
            "extra": "mean: 6.135270888158011 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 275.82875747522206,
            "unit": "iter/sec",
            "range": "stddev: 0.00010477614076059387",
            "extra": "mean: 3.625437786666718 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 268.61901661295724,
            "unit": "iter/sec",
            "range": "stddev: 0.0001340264775588156",
            "extra": "mean: 3.7227446239998017 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 229.16420062926687,
            "unit": "iter/sec",
            "range": "stddev: 0.00010600768334925118",
            "extra": "mean: 4.363683320754633 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 117.58193383405954,
            "unit": "iter/sec",
            "range": "stddev: 0.0006221627544229484",
            "extra": "mean: 8.504707886598252 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 225.46679406410502,
            "unit": "iter/sec",
            "range": "stddev: 0.00012599276620829715",
            "extra": "mean: 4.435242910828274 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 279.22872612523355,
            "unit": "iter/sec",
            "range": "stddev: 0.00018846491911700793",
            "extra": "mean: 3.5812934216213197 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 280.34975871013233,
            "unit": "iter/sec",
            "range": "stddev: 0.00009671652794047877",
            "extra": "mean: 3.566972929104427 msec\nrounds: 268"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 235.21952340850038,
            "unit": "iter/sec",
            "range": "stddev: 0.00027099709962126364",
            "extra": "mean: 4.251347785716421 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 253.98203188839415,
            "unit": "iter/sec",
            "range": "stddev: 0.0001705667744674983",
            "extra": "mean: 3.937286400005746 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "64a174e1b9efb9a86ace4722d271c1ea53250ac9",
          "message": "Merge pull request #88 from stnkvcmls/claude/workout-dark-theme-colors-nku5s0\n\nfix: dark theme tooltip text color on workout page zone charts",
          "timestamp": "2026-06-25T17:08:44-07:00",
          "tree_id": "92673b110bfd8886c8084eb6dafd45442cbcffb7",
          "url": "https://github.com/stnkvcmls/running-coach/commit/64a174e1b9efb9a86ace4722d271c1ea53250ac9"
        },
        "date": 1782432577347,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 384.8609918405556,
            "unit": "iter/sec",
            "range": "stddev: 0.0002044669797581416",
            "extra": "mean: 2.5983407547166824 msec\nrounds: 53"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 22.423028837706994,
            "unit": "iter/sec",
            "range": "stddev: 0.033917154958229716",
            "extra": "mean: 44.59700815789796 msec\nrounds: 19"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 28.032467899523155,
            "unit": "iter/sec",
            "range": "stddev: 0.024874126988719426",
            "extra": "mean: 35.67292054286131 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 80.38990145100603,
            "unit": "iter/sec",
            "range": "stddev: 0.01128904396349458",
            "extra": "mean: 12.439373378377063 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 82.19907697929494,
            "unit": "iter/sec",
            "range": "stddev: 0.0001862826997412683",
            "extra": "mean: 12.165586728569824 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 180.05465720469286,
            "unit": "iter/sec",
            "range": "stddev: 0.00007087311130016484",
            "extra": "mean: 5.553869116882451 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 184.60726034681022,
            "unit": "iter/sec",
            "range": "stddev: 0.00007765404761699887",
            "extra": "mean: 5.416905045453586 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 201.36535430265937,
            "unit": "iter/sec",
            "range": "stddev: 0.0001262802768006336",
            "extra": "mean: 4.966097586464472 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.57869785138377,
            "unit": "iter/sec",
            "range": "stddev: 0.00032376527277627585",
            "extra": "mean: 7.063209474137893 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 186.58588443851764,
            "unit": "iter/sec",
            "range": "stddev: 0.00027635081995288805",
            "extra": "mean: 5.359462228395484 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 248.45275318800446,
            "unit": "iter/sec",
            "range": "stddev: 0.008602255081009553",
            "extra": "mean: 4.024910117390806 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 149.53071334710714,
            "unit": "iter/sec",
            "range": "stddev: 0.00023168813537837623",
            "extra": "mean: 6.687589309352721 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 219.38618805779788,
            "unit": "iter/sec",
            "range": "stddev: 0.0001530633195591134",
            "extra": "mean: 4.558172093024139 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 264.7998123670885,
            "unit": "iter/sec",
            "range": "stddev: 0.00017358820961058753",
            "extra": "mean: 3.776437721238689 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 279.61385450495,
            "unit": "iter/sec",
            "range": "stddev: 0.0001281136178338056",
            "extra": "mean: 3.5763606984728185 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 232.91785566713844,
            "unit": "iter/sec",
            "range": "stddev: 0.00014933949890877217",
            "extra": "mean: 4.293359120689717 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 113.2166919235864,
            "unit": "iter/sec",
            "range": "stddev: 0.00029853260815003755",
            "extra": "mean: 8.832619846152475 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.07159251568018,
            "unit": "iter/sec",
            "range": "stddev: 0.0003542783950230558",
            "extra": "mean: 35.62320162069259 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 158.63923423661137,
            "unit": "iter/sec",
            "range": "stddev: 0.0003141760811779282",
            "extra": "mean: 6.303610861538162 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 165.9359747463732,
            "unit": "iter/sec",
            "range": "stddev: 0.013767210013714703",
            "extra": "mean: 6.026420741665343 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 89.14255868820939,
            "unit": "iter/sec",
            "range": "stddev: 0.001438324276913038",
            "extra": "mean: 11.217986276315703 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.444024397998422,
            "unit": "iter/sec",
            "range": "stddev: 0.004004678780278926",
            "extra": "mean: 134.33593799999954 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.515639550117008,
            "unit": "iter/sec",
            "range": "stddev: 0.03438823541477884",
            "extra": "mean: 51.24095459090421 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.29524159268614,
            "unit": "iter/sec",
            "range": "stddev: 0.0015879562395983155",
            "extra": "mean: 30.034321787881748 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 123.48766692464972,
            "unit": "iter/sec",
            "range": "stddev: 0.0007356186671209872",
            "extra": "mean: 8.097974679610594 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 214.5710803143609,
            "unit": "iter/sec",
            "range": "stddev: 0.0002998842309881344",
            "extra": "mean: 4.660460293786719 msec\nrounds: 177"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 213.7356948717612,
            "unit": "iter/sec",
            "range": "stddev: 0.0001830280230637233",
            "extra": "mean: 4.67867569148891 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.67468576632473,
            "unit": "iter/sec",
            "range": "stddev: 0.00015519613363368826",
            "extra": "mean: 5.628263788321461 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 103.74789729459123,
            "unit": "iter/sec",
            "range": "stddev: 0.0005573632088993582",
            "extra": "mean: 9.638749565791285 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.06854700330518,
            "unit": "iter/sec",
            "range": "stddev: 0.00022438438154194224",
            "extra": "mean: 5.492436867647691 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.58676464486288,
            "unit": "iter/sec",
            "range": "stddev: 0.00013767728913054202",
            "extra": "mean: 4.318036056738799 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 201.34966786564897,
            "unit": "iter/sec",
            "range": "stddev: 0.009118956114929178",
            "extra": "mean: 4.966484477477521 msec\nrounds: 222"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 182.77634233774748,
            "unit": "iter/sec",
            "range": "stddev: 0.0006220597611327791",
            "extra": "mean: 5.471167587718365 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 207.3951511220995,
            "unit": "iter/sec",
            "range": "stddev: 0.00026630606975985524",
            "extra": "mean: 4.821713500000158 msec\nrounds: 12"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7cf3bd0df2e472931fa81a922bfc77256abcf91b",
          "message": "Merge pull request #89 from stnkvcmls/claude/p0-1-streaming-tokens-xr2jr6\n\nfeat(p0-1): conversational AI coach with SSE streaming tokens",
          "timestamp": "2026-06-26T05:23:57-07:00",
          "tree_id": "5b62e0577878be97b5b2cf21bc8c94a90579ae60",
          "url": "https://github.com/stnkvcmls/running-coach/commit/7cf3bd0df2e472931fa81a922bfc77256abcf91b"
        },
        "date": 1782476693092,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 370.8686799567915,
            "unit": "iter/sec",
            "range": "stddev: 0.0002836822165326645",
            "extra": "mean: 2.696372204081796 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 23.415246856723524,
            "unit": "iter/sec",
            "range": "stddev: 0.02814385542772142",
            "extra": "mean: 42.70721577777673 msec\nrounds: 18"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 31.118851406751013,
            "unit": "iter/sec",
            "range": "stddev: 0.002016597546703139",
            "extra": "mean: 32.13486214285715 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 68.490086778184,
            "unit": "iter/sec",
            "range": "stddev: 0.014521844831083847",
            "extra": "mean: 14.600653131578861 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 67.97013325488975,
            "unit": "iter/sec",
            "range": "stddev: 0.0010438761401091671",
            "extra": "mean: 14.712344262294945 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 150.20657771982127,
            "unit": "iter/sec",
            "range": "stddev: 0.0008571740432892353",
            "extra": "mean: 6.657498061538219 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 151.35937545814588,
            "unit": "iter/sec",
            "range": "stddev: 0.001402522236435078",
            "extra": "mean: 6.606792588652835 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 131.58660094801508,
            "unit": "iter/sec",
            "range": "stddev: 0.012930036969682656",
            "extra": "mean: 7.599557954955174 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 123.63245145602872,
            "unit": "iter/sec",
            "range": "stddev: 0.0007934428830771325",
            "extra": "mean: 8.088491235294006 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 184.79845681673544,
            "unit": "iter/sec",
            "range": "stddev: 0.0002023842290463919",
            "extra": "mean: 5.411300598639196 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 290.8484763474037,
            "unit": "iter/sec",
            "range": "stddev: 0.0001223066552613655",
            "extra": "mean: 3.438216395555571 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 152.7029715938514,
            "unit": "iter/sec",
            "range": "stddev: 0.00011491040325271446",
            "extra": "mean: 6.548661034964857 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 221.0053986234775,
            "unit": "iter/sec",
            "range": "stddev: 0.00013835920995509306",
            "extra": "mean: 4.524776345865107 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 236.42296521912235,
            "unit": "iter/sec",
            "range": "stddev: 0.00722832908866048",
            "extra": "mean: 4.229707545851888 msec\nrounds: 229"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 281.1662492071535,
            "unit": "iter/sec",
            "range": "stddev: 0.00009942719764797894",
            "extra": "mean: 3.5566146463875 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 233.51585866909443,
            "unit": "iter/sec",
            "range": "stddev: 0.00025447915685273615",
            "extra": "mean: 4.282364400000165 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 122.90967166846579,
            "unit": "iter/sec",
            "range": "stddev: 0.000125573619586501",
            "extra": "mean: 8.136056230769055 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.413745779334405,
            "unit": "iter/sec",
            "range": "stddev: 0.0005261247767116496",
            "extra": "mean: 33.99771003333356 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 151.1058701676302,
            "unit": "iter/sec",
            "range": "stddev: 0.00042955315623639426",
            "extra": "mean: 6.617876584745808 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 193.3119462934723,
            "unit": "iter/sec",
            "range": "stddev: 0.0005901714317023445",
            "extra": "mean: 5.1729860423725285 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 92.32873394093352,
            "unit": "iter/sec",
            "range": "stddev: 0.0005839433997887274",
            "extra": "mean: 10.830864426666361 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.293397803067956,
            "unit": "iter/sec",
            "range": "stddev: 0.008197147922306606",
            "extra": "mean: 137.1103053749998 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.671992404882598,
            "unit": "iter/sec",
            "range": "stddev: 0.02400190802352975",
            "extra": "mean: 44.10728365384605 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.448840616522965,
            "unit": "iter/sec",
            "range": "stddev: 0.0008425743186977913",
            "extra": "mean: 29.896402433333456 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 130.3171733450524,
            "unit": "iter/sec",
            "range": "stddev: 0.00009271684214758405",
            "extra": "mean: 7.6735857165364605 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 216.72498046667147,
            "unit": "iter/sec",
            "range": "stddev: 0.0001950266447545459",
            "extra": "mean: 4.614142762162032 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.07542603455187,
            "unit": "iter/sec",
            "range": "stddev: 0.00009755062550970274",
            "extra": "mean: 4.606693711340823 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 180.99497600222682,
            "unit": "iter/sec",
            "range": "stddev: 0.00011091024005161167",
            "extra": "mean: 5.525015235714039 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 109.50355368745349,
            "unit": "iter/sec",
            "range": "stddev: 0.0001293792383537504",
            "extra": "mean: 9.132123719511545 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.55691077443157,
            "unit": "iter/sec",
            "range": "stddev: 0.0001320006483237908",
            "extra": "mean: 5.477743875911693 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.65570102776385,
            "unit": "iter/sec",
            "range": "stddev: 0.00012911601652236442",
            "extra": "mean: 4.316751090361253 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 232.22519096327028,
            "unit": "iter/sec",
            "range": "stddev: 0.00010373502838672656",
            "extra": "mean: 4.306165045454367 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 193.48924503208704,
            "unit": "iter/sec",
            "range": "stddev: 0.00023870552336439417",
            "extra": "mean: 5.168245913793122 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.75986595667115,
            "unit": "iter/sec",
            "range": "stddev: 0.00012961030821312378",
            "extra": "mean: 4.744736363637581 msec\nrounds: 11"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0f4a09b18202e9b05e9d1dc9a34f70b402f28960",
          "message": "Merge pull request #90 from stnkvcmls/claude/p0-2-streaming-tokens-gvziei\n\nfeat(p0-2): aerobic decoupling and efficiency factor",
          "timestamp": "2026-06-26T06:56:48-07:00",
          "tree_id": "012f55d35a28d3bfa012e9950098d7ff4b9ae6b2",
          "url": "https://github.com/stnkvcmls/running-coach/commit/0f4a09b18202e9b05e9d1dc9a34f70b402f28960"
        },
        "date": 1782482266187,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 375.64857029995454,
            "unit": "iter/sec",
            "range": "stddev: 0.00017837280445091833",
            "extra": "mean: 2.662062574074226 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 21.25605154473495,
            "unit": "iter/sec",
            "range": "stddev: 0.03545192147952887",
            "extra": "mean: 47.045425999999345 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 27.841261220067636,
            "unit": "iter/sec",
            "range": "stddev: 0.022046121833401638",
            "extra": "mean: 35.91791306060562 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 68.44732669252,
            "unit": "iter/sec",
            "range": "stddev: 0.0184447110313908",
            "extra": "mean: 14.609774381579774 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 75.98298276569975,
            "unit": "iter/sec",
            "range": "stddev: 0.00042108609661184313",
            "extra": "mean: 13.160841593749861 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 127.22501618193702,
            "unit": "iter/sec",
            "range": "stddev: 0.01355900875705089",
            "extra": "mean: 7.860089391303034 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.38132595138893,
            "unit": "iter/sec",
            "range": "stddev: 0.00013879944915567012",
            "extra": "mean: 5.574716290540705 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 186.82018514785193,
            "unit": "iter/sec",
            "range": "stddev: 0.0006160465146700915",
            "extra": "mean: 5.352740653846301 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 111.04765440427629,
            "unit": "iter/sec",
            "range": "stddev: 0.0010980317006144959",
            "extra": "mean: 9.00514293043448 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 161.8869772437418,
            "unit": "iter/sec",
            "range": "stddev: 0.0003989685875963437",
            "extra": "mean: 6.177149126049655 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 282.4433026291463,
            "unit": "iter/sec",
            "range": "stddev: 0.00012420615536370158",
            "extra": "mean: 3.5405335891891196 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 129.50440171078392,
            "unit": "iter/sec",
            "range": "stddev: 0.010241547038816428",
            "extra": "mean: 7.7217452595414695 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.56212576845573,
            "unit": "iter/sec",
            "range": "stddev: 0.00018588582249827928",
            "extra": "mean: 4.639033858267577 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 221.31433117832376,
            "unit": "iter/sec",
            "range": "stddev: 0.00039830418651904835",
            "extra": "mean: 4.5184602130182485 msec\nrounds: 169"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 269.8233805424443,
            "unit": "iter/sec",
            "range": "stddev: 0.0002455426516217935",
            "extra": "mean: 3.7061280530606058 msec\nrounds: 245"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 232.2985169127462,
            "unit": "iter/sec",
            "range": "stddev: 0.00017200997394882845",
            "extra": "mean: 4.304805787355115 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 109.38055553305121,
            "unit": "iter/sec",
            "range": "stddev: 0.0005326940283613634",
            "extra": "mean: 9.14239276923249 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.279712234187418,
            "unit": "iter/sec",
            "range": "stddev: 0.0006271785734913798",
            "extra": "mean: 36.65727817857193 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 161.4995133897407,
            "unit": "iter/sec",
            "range": "stddev: 0.00023961677346776364",
            "extra": "mean: 6.191969121211763 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 206.4466331395004,
            "unit": "iter/sec",
            "range": "stddev: 0.00015116699567809905",
            "extra": "mean: 4.843866837606786 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 92.77500473071224,
            "unit": "iter/sec",
            "range": "stddev: 0.0005531386935062202",
            "extra": "mean: 10.778765281689713 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.131710106761489,
            "unit": "iter/sec",
            "range": "stddev: 0.006988438242243147",
            "extra": "mean: 140.21882340000218 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.88870176993076,
            "unit": "iter/sec",
            "range": "stddev: 0.030733326502932555",
            "extra": "mean: 50.279802652170865 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 31.879127546302144,
            "unit": "iter/sec",
            "range": "stddev: 0.001436847793147675",
            "extra": "mean: 31.36848706250106 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.92874011041584,
            "unit": "iter/sec",
            "range": "stddev: 0.0001721306743709737",
            "extra": "mean: 7.878436350428562 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 178.05351576468294,
            "unit": "iter/sec",
            "range": "stddev: 0.010663758226505995",
            "extra": "mean: 5.616288988764527 msec\nrounds: 178"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.9289816287223,
            "unit": "iter/sec",
            "range": "stddev: 0.00015812718943766538",
            "extra": "mean: 4.7409321956534285 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 173.2794302444072,
            "unit": "iter/sec",
            "range": "stddev: 0.00027356079242970107",
            "extra": "mean: 5.771025439023662 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 98.40677450087037,
            "unit": "iter/sec",
            "range": "stddev: 0.0007762936237303517",
            "extra": "mean: 10.16190201408497 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 171.09781292022083,
            "unit": "iter/sec",
            "range": "stddev: 0.00108676792358737",
            "extra": "mean: 5.844610067963161 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.9559826238195,
            "unit": "iter/sec",
            "range": "stddev: 0.00019479636218767694",
            "extra": "mean: 4.386811824325896 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 227.70978970002727,
            "unit": "iter/sec",
            "range": "stddev: 0.00012841524907712874",
            "extra": "mean: 4.391554712326363 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 185.7980119973513,
            "unit": "iter/sec",
            "range": "stddev: 0.00036930470168042",
            "extra": "mean: 5.382188911764329 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 187.84085836952775,
            "unit": "iter/sec",
            "range": "stddev: 0.0004130632735610304",
            "extra": "mean: 5.323655400002281 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2b00847d36d72c646471957210d8256b6cdf59c9",
          "message": "Merge pull request #92 from stnkvcmls/claude/cadence-stride-calculation-rghjmk\n\nfix: correct cadence doubling and stride unit conversion",
          "timestamp": "2026-06-26T12:36:46-07:00",
          "tree_id": "4db33d24cd6ac88d0167457b9fccbb9b6101ef8c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/2b00847d36d72c646471957210d8256b6cdf59c9"
        },
        "date": 1782502662200,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 426.08350092212186,
            "unit": "iter/sec",
            "range": "stddev: 0.00020100927543751138",
            "extra": "mean: 2.3469578095275194 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 27.364954258591386,
            "unit": "iter/sec",
            "range": "stddev: 0.019791093854868165",
            "extra": "mean: 36.54309049999761 msec\nrounds: 18"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.255287461050397,
            "unit": "iter/sec",
            "range": "stddev: 0.020012743018542566",
            "extra": "mean: 34.181855205879266 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 86.24945217137252,
            "unit": "iter/sec",
            "range": "stddev: 0.00932910334528539",
            "extra": "mean: 11.59427654117802 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 86.97584334169268,
            "unit": "iter/sec",
            "range": "stddev: 0.00033374680414019155",
            "extra": "mean: 11.497445285714646 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 176.29143360834527,
            "unit": "iter/sec",
            "range": "stddev: 0.00012120300265746335",
            "extra": "mean: 5.672425367086367 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 192.56071477246226,
            "unit": "iter/sec",
            "range": "stddev: 0.00017787685805869668",
            "extra": "mean: 5.193167262500253 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 221.58437544032427,
            "unit": "iter/sec",
            "range": "stddev: 0.00019280439949625753",
            "extra": "mean: 4.5129535781249785 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 156.0339770631185,
            "unit": "iter/sec",
            "range": "stddev: 0.00017580308534184488",
            "extra": "mean: 6.408860549619153 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 210.15147735313394,
            "unit": "iter/sec",
            "range": "stddev: 0.00020007701777030788",
            "extra": "mean: 4.7584723771397615 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 275.2980621824102,
            "unit": "iter/sec",
            "range": "stddev: 0.0064645474500811565",
            "extra": "mean: 3.632426585470871 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 156.821852575189,
            "unit": "iter/sec",
            "range": "stddev: 0.00023119734454764108",
            "extra": "mean: 6.3766623310392605 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 241.46555618424662,
            "unit": "iter/sec",
            "range": "stddev: 0.00013362943415532746",
            "extra": "mean: 4.141377411347916 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 285.91674255614646,
            "unit": "iter/sec",
            "range": "stddev: 0.00013113654832217002",
            "extra": "mean: 3.497521659836435 msec\nrounds: 244"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 295.13984116718075,
            "unit": "iter/sec",
            "range": "stddev: 0.0001419015802169926",
            "extra": "mean: 3.3882243618663264 msec\nrounds: 257"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 250.7140165158399,
            "unit": "iter/sec",
            "range": "stddev: 0.00013429231639015945",
            "extra": "mean: 3.988608271276372 msec\nrounds: 188"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 122.93844737120241,
            "unit": "iter/sec",
            "range": "stddev: 0.0007521492332154676",
            "extra": "mean: 8.134151857153224 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.814472137414096,
            "unit": "iter/sec",
            "range": "stddev: 0.000600905986539884",
            "extra": "mean: 34.70478290322563 msec\nrounds: 31"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 161.37084741250015,
            "unit": "iter/sec",
            "range": "stddev: 0.008928034243031764",
            "extra": "mean: 6.1969061700703305 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 218.52045641676386,
            "unit": "iter/sec",
            "range": "stddev: 0.00018069913001670157",
            "extra": "mean: 4.576230602835611 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 111.33752666873315,
            "unit": "iter/sec",
            "range": "stddev: 0.000271295982221644",
            "extra": "mean: 8.981697635293612 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.96152348384563,
            "unit": "iter/sec",
            "range": "stddev: 0.005356301675234488",
            "extra": "mean: 111.58816933333229 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.564235614488062,
            "unit": "iter/sec",
            "range": "stddev: 0.02297951394647399",
            "extra": "mean: 46.373078919993986 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.95298656370913,
            "unit": "iter/sec",
            "range": "stddev: 0.0008058136300782753",
            "extra": "mean: 25.02941797368258 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 133.1205597236246,
            "unit": "iter/sec",
            "range": "stddev: 0.0002721042915749491",
            "extra": "mean: 7.511987645455582 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 225.8311500880341,
            "unit": "iter/sec",
            "range": "stddev: 0.00013877442206466234",
            "extra": "mean: 4.428087089005115 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 222.94552355849376,
            "unit": "iter/sec",
            "range": "stddev: 0.00013266207202830454",
            "extra": "mean: 4.485400666668384 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 186.19079821491567,
            "unit": "iter/sec",
            "range": "stddev: 0.00034084773590763585",
            "extra": "mean: 5.370834700680125 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 115.75389532709652,
            "unit": "iter/sec",
            "range": "stddev: 0.0003193239594304951",
            "extra": "mean: 8.639018126985768 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 157.9228849871054,
            "unit": "iter/sec",
            "range": "stddev: 0.010562746009999896",
            "extra": "mean: 6.332204481203919 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 236.97555973428985,
            "unit": "iter/sec",
            "range": "stddev: 0.0001775602818180309",
            "extra": "mean: 4.219844447761852 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 239.88917431356722,
            "unit": "iter/sec",
            "range": "stddev: 0.00010689232003984148",
            "extra": "mean: 4.1685916126121905 msec\nrounds: 222"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 199.5740683524318,
            "unit": "iter/sec",
            "range": "stddev: 0.00017340585529089796",
            "extra": "mean: 5.010671016808057 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 211.21462844354824,
            "unit": "iter/sec",
            "range": "stddev: 0.00038039756741516253",
            "extra": "mean: 4.734520555555516 msec\nrounds: 9"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1467ca85e6be37edb142e9416dbdaf0b9ccd6bd2",
          "message": "Merge pull request #91 from stnkvcmls/claude/workout-adherence-intervals-sm9630\n\nFix interval alignment grouping all same-intensity laps into one segment",
          "timestamp": "2026-06-26T14:09:24-07:00",
          "tree_id": "e7a135e5dcc84038d8f3dde5ab3347135c8d09a9",
          "url": "https://github.com/stnkvcmls/running-coach/commit/1467ca85e6be37edb142e9416dbdaf0b9ccd6bd2"
        },
        "date": 1782508222032,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 515.7099554795802,
            "unit": "iter/sec",
            "range": "stddev: 0.0003557564559161597",
            "extra": "mean: 1.9390744533330917 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 29.535311958226046,
            "unit": "iter/sec",
            "range": "stddev: 0.02775881206774642",
            "extra": "mean: 33.857776800000394 msec\nrounds: 20"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.295040068770216,
            "unit": "iter/sec",
            "range": "stddev: 0.03367786182986961",
            "extra": "mean: 34.13547131707266 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 87.6072727852344,
            "unit": "iter/sec",
            "range": "stddev: 0.017908118057203236",
            "extra": "mean: 11.414577445544488 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 90.47763882931203,
            "unit": "iter/sec",
            "range": "stddev: 0.0005368803543274775",
            "extra": "mean: 11.052454649999444 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 198.4883515103654,
            "unit": "iter/sec",
            "range": "stddev: 0.00036108604415333186",
            "extra": "mean: 5.038079022726824 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 229.1495058801836,
            "unit": "iter/sec",
            "range": "stddev: 0.00011593972089388311",
            "extra": "mean: 4.363963152173998 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 230.73271792562159,
            "unit": "iter/sec",
            "range": "stddev: 0.00020293597757740196",
            "extra": "mean: 4.334019071895809 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.28337501651333,
            "unit": "iter/sec",
            "range": "stddev: 0.01302305259360408",
            "extra": "mean: 7.284203202898483 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 182.65022094468796,
            "unit": "iter/sec",
            "range": "stddev: 0.0005580293444577989",
            "extra": "mean: 5.474945471337976 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 332.9480995549831,
            "unit": "iter/sec",
            "range": "stddev: 0.00021130674096271433",
            "extra": "mean: 3.0034711155780593 msec\nrounds: 199"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 166.77482031027856,
            "unit": "iter/sec",
            "range": "stddev: 0.0003472953532536285",
            "extra": "mean: 5.996108993788967 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 277.306192956052,
            "unit": "iter/sec",
            "range": "stddev: 0.00024424957034412613",
            "extra": "mean: 3.606122132867339 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 328.8465623508754,
            "unit": "iter/sec",
            "range": "stddev: 0.0001603137498210831",
            "extra": "mean: 3.040931894957782 msec\nrounds: 238"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 354.8375319530839,
            "unit": "iter/sec",
            "range": "stddev: 0.00013673179284996717",
            "extra": "mean: 2.8181911718747346 msec\nrounds: 256"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 279.6463368705697,
            "unit": "iter/sec",
            "range": "stddev: 0.0004894888378406119",
            "extra": "mean: 3.5759452857157776 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 132.22015908170727,
            "unit": "iter/sec",
            "range": "stddev: 0.0006876319359219826",
            "extra": "mean: 7.5631432222225365 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 33.528751501409694,
            "unit": "iter/sec",
            "range": "stddev: 0.000936761330964349",
            "extra": "mean: 29.82514872222295 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 203.52671475337064,
            "unit": "iter/sec",
            "range": "stddev: 0.0002139267651646661",
            "extra": "mean: 4.913359905660438 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 271.5360500067157,
            "unit": "iter/sec",
            "range": "stddev: 0.00013063241254364166",
            "extra": "mean: 3.6827522532469184 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 111.22078824078226,
            "unit": "iter/sec",
            "range": "stddev: 0.0005184904594086339",
            "extra": "mean: 8.991124913043203 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.776478300929064,
            "unit": "iter/sec",
            "range": "stddev: 0.06506537719861545",
            "extra": "mean: 113.94091863636712 msec\nrounds: 11"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 24.36026774575968,
            "unit": "iter/sec",
            "range": "stddev: 0.029963234513440556",
            "extra": "mean: 41.05045192592627 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 53.36157871511489,
            "unit": "iter/sec",
            "range": "stddev: 0.0008793591341863911",
            "extra": "mean: 18.740075239129794 msec\nrounds: 46"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 166.63187378713508,
            "unit": "iter/sec",
            "range": "stddev: 0.00018235820897007825",
            "extra": "mean: 6.001252805195339 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 280.87128713951523,
            "unit": "iter/sec",
            "range": "stddev: 0.00015942198853738805",
            "extra": "mean: 3.5603496896543825 msec\nrounds: 232"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 264.1262250049941,
            "unit": "iter/sec",
            "range": "stddev: 0.0003812223884572389",
            "extra": "mean: 3.786068573770332 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 217.64482306164285,
            "unit": "iter/sec",
            "range": "stddev: 0.0005146235293051912",
            "extra": "mean: 4.594641792682444 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 107.9171839650676,
            "unit": "iter/sec",
            "range": "stddev: 0.0006991297082900137",
            "extra": "mean: 9.266364848101452 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 229.84421623078651,
            "unit": "iter/sec",
            "range": "stddev: 0.00016960052749645472",
            "extra": "mean: 4.350772955695784 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 214.60601793294532,
            "unit": "iter/sec",
            "range": "stddev: 0.013960615253113599",
            "extra": "mean: 4.659701576087465 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 281.69562144029027,
            "unit": "iter/sec",
            "range": "stddev: 0.00014612361885933518",
            "extra": "mean: 3.5499309321425345 msec\nrounds: 280"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 219.89507483031835,
            "unit": "iter/sec",
            "range": "stddev: 0.0002961841130411739",
            "extra": "mean: 4.547623455284973 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 251.132797265163,
            "unit": "iter/sec",
            "range": "stddev: 0.0003029946702692779",
            "extra": "mean: 3.981957000001606 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "02432c94de868a5ade684218b67199a476edf81b",
          "message": "Merge pull request #93 from stnkvcmls/claude/fix-stride-alembic-migration\n\nfix: migrate existing avg_stride values from cm to m\n\nOne-time data migration divides avg_stride > 5 by 100 to correct\nactivities already stored with Garmin's raw centimetre value.\n\nCo-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_01D1GHCuj7NkXQRDdduL8nwP",
          "timestamp": "2026-06-26T14:19:18-07:00",
          "tree_id": "fb0be396d0680c3e45f4cd38bc03e72889eda6c8",
          "url": "https://github.com/stnkvcmls/running-coach/commit/02432c94de868a5ade684218b67199a476edf81b"
        },
        "date": 1782508817775,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 421.88221021016415,
            "unit": "iter/sec",
            "range": "stddev: 0.0001794558588446044",
            "extra": "mean: 2.370329859374354 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 23.410517248685075,
            "unit": "iter/sec",
            "range": "stddev: 0.03468720952170951",
            "extra": "mean: 42.715843882354555 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 27.254336010351516,
            "unit": "iter/sec",
            "range": "stddev: 0.028666518805270234",
            "extra": "mean: 36.69140938235253 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 70.70802664923566,
            "unit": "iter/sec",
            "range": "stddev: 0.019528016543757375",
            "extra": "mean: 14.142665937500176 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.83630656005555,
            "unit": "iter/sec",
            "range": "stddev: 0.0001974746280849087",
            "extra": "mean: 12.370678999999488 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 169.9780338040717,
            "unit": "iter/sec",
            "range": "stddev: 0.0002624124239757352",
            "extra": "mean: 5.883113115384475 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.26412172614405,
            "unit": "iter/sec",
            "range": "stddev: 0.00007959885954578282",
            "extra": "mean: 5.311686532894657 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.88279161678128,
            "unit": "iter/sec",
            "range": "stddev: 0.00013978978890865466",
            "extra": "mean: 5.079164064000224 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 112.36174574662319,
            "unit": "iter/sec",
            "range": "stddev: 0.014454391640345232",
            "extra": "mean: 8.899826122807042 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 181.71452406588804,
            "unit": "iter/sec",
            "range": "stddev: 0.00025547795273458116",
            "extra": "mean: 5.503137435714324 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 305.1264184250558,
            "unit": "iter/sec",
            "range": "stddev: 0.00011735615555705501",
            "extra": "mean: 3.2773301150441574 msec\nrounds: 226"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 151.19195290173616,
            "unit": "iter/sec",
            "range": "stddev: 0.00046550836876107224",
            "extra": "mean: 6.614108626865397 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 237.0281840951519,
            "unit": "iter/sec",
            "range": "stddev: 0.00013794610921825178",
            "extra": "mean: 4.218907569230514 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 280.5839466573802,
            "unit": "iter/sec",
            "range": "stddev: 0.00025120360913318565",
            "extra": "mean: 3.56399577350409 msec\nrounds: 234"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 287.5893109005597,
            "unit": "iter/sec",
            "range": "stddev: 0.000263350253299911",
            "extra": "mean: 3.4771806951676725 msec\nrounds: 269"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 196.48511902381577,
            "unit": "iter/sec",
            "range": "stddev: 0.01309430960771804",
            "extra": "mean: 5.089443948570939 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 101.73967407853142,
            "unit": "iter/sec",
            "range": "stddev: 0.000532914858451094",
            "extra": "mean: 9.829007307691139 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 25.896501986448087,
            "unit": "iter/sec",
            "range": "stddev: 0.002542453213327054",
            "extra": "mean: 38.615253925928315 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 157.48741826960065,
            "unit": "iter/sec",
            "range": "stddev: 0.0006652923152829472",
            "extra": "mean: 6.349713589742851 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 190.94005709252943,
            "unit": "iter/sec",
            "range": "stddev: 0.0014024372364698418",
            "extra": "mean: 5.237245736840859 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 85.57645531859588,
            "unit": "iter/sec",
            "range": "stddev: 0.0010881782089230798",
            "extra": "mean: 11.685457130434552 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.716110733240821,
            "unit": "iter/sec",
            "range": "stddev: 0.0053609362378507185",
            "extra": "mean: 114.7300706249954 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.247395762739647,
            "unit": "iter/sec",
            "range": "stddev: 0.043302324993738664",
            "extra": "mean: 57.979767714285686 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.852585318750805,
            "unit": "iter/sec",
            "range": "stddev: 0.002338370754189187",
            "extra": "mean: 26.41827477777683 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 121.80422247267764,
            "unit": "iter/sec",
            "range": "stddev: 0.0006732745288802337",
            "extra": "mean: 8.209896009346588 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 222.4684456227978,
            "unit": "iter/sec",
            "range": "stddev: 0.0002119402706470481",
            "extra": "mean: 4.495019494564777 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 218.4722823634187,
            "unit": "iter/sec",
            "range": "stddev: 0.00015094775878087246",
            "extra": "mean: 4.577239680851347 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 181.4276714332032,
            "unit": "iter/sec",
            "range": "stddev: 0.00032401966366978356",
            "extra": "mean: 5.511838365671651 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 77.36799358891416,
            "unit": "iter/sec",
            "range": "stddev: 0.022579302926168738",
            "extra": "mean: 12.9252414805195 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 180.92009807750216,
            "unit": "iter/sec",
            "range": "stddev: 0.00043738396703202516",
            "extra": "mean: 5.527301889763636 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 234.0729580552661,
            "unit": "iter/sec",
            "range": "stddev: 0.0001743266959091575",
            "extra": "mean: 4.272172267605102 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 232.23775225316353,
            "unit": "iter/sec",
            "range": "stddev: 0.00013083034587639707",
            "extra": "mean: 4.305932133333322 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 192.01604123952185,
            "unit": "iter/sec",
            "range": "stddev: 0.00032464388380705727",
            "extra": "mean: 5.2078982232145625 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 204.0270569023926,
            "unit": "iter/sec",
            "range": "stddev: 0.0005037690796418795",
            "extra": "mean: 4.901310714286312 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3e0e75bb6e38781b55467ddaafb995b5c576e062",
          "message": "Merge pull request #94 from stnkvcmls/claude/gap-data-plotting-xkg2vc\n\nAdd GAP pace chart to activity detail view",
          "timestamp": "2026-06-26T16:43:44-07:00",
          "tree_id": "2f3c91e44111821449b2d206743dfa24931e41a8",
          "url": "https://github.com/stnkvcmls/running-coach/commit/3e0e75bb6e38781b55467ddaafb995b5c576e062"
        },
        "date": 1782517477549,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 409.9920989145815,
            "unit": "iter/sec",
            "range": "stddev: 0.00020933889281081716",
            "extra": "mean: 2.439071393442491 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 24.044632040832195,
            "unit": "iter/sec",
            "range": "stddev: 0.029766591942006",
            "extra": "mean: 41.58932431578976 msec\nrounds: 19"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 26.254159571804475,
            "unit": "iter/sec",
            "range": "stddev: 0.028929263024748617",
            "extra": "mean: 38.08920248484911 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 81.23467902670865,
            "unit": "iter/sec",
            "range": "stddev: 0.012916493927513583",
            "extra": "mean: 12.310013555555704 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.11947591053601,
            "unit": "iter/sec",
            "range": "stddev: 0.0005243959062389243",
            "extra": "mean: 12.481359727273206 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 164.88774388490413,
            "unit": "iter/sec",
            "range": "stddev: 0.0005747552315871861",
            "extra": "mean: 6.0647321410257495 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 188.25778777254578,
            "unit": "iter/sec",
            "range": "stddev: 0.00005733010512732183",
            "extra": "mean: 5.311865245161631 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 200.9266795415947,
            "unit": "iter/sec",
            "range": "stddev: 0.00013560739810158874",
            "extra": "mean: 4.976939858267979 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 144.03821558559687,
            "unit": "iter/sec",
            "range": "stddev: 0.00008056416036264102",
            "extra": "mean: 6.942601974999718 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 190.63395081447342,
            "unit": "iter/sec",
            "range": "stddev: 0.00010503007728771989",
            "extra": "mean: 5.245655329114007 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 306.25242233691284,
            "unit": "iter/sec",
            "range": "stddev: 0.00011177535220266549",
            "extra": "mean: 3.2652802951543194 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 133.87541644207306,
            "unit": "iter/sec",
            "range": "stddev: 0.01156900932614286",
            "extra": "mean: 7.469631292857214 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 179.85997168683633,
            "unit": "iter/sec",
            "range": "stddev: 0.013422030933972132",
            "extra": "mean: 5.559880781818162 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 277.55991252143787,
            "unit": "iter/sec",
            "range": "stddev: 0.00020448006273551393",
            "extra": "mean: 3.6028257500000587 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 291.06532095402207,
            "unit": "iter/sec",
            "range": "stddev: 0.00012089371347320458",
            "extra": "mean: 3.4356549132074874 msec\nrounds: 265"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 248.6226401090583,
            "unit": "iter/sec",
            "range": "stddev: 0.00010107331740261878",
            "extra": "mean: 4.0221598465906006 msec\nrounds: 176"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 116.28995712862688,
            "unit": "iter/sec",
            "range": "stddev: 0.00017326880275088554",
            "extra": "mean: 8.599194846154363 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.701115849998867,
            "unit": "iter/sec",
            "range": "stddev: 0.000283856643373117",
            "extra": "mean: 34.841850931034074 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.42520269203771,
            "unit": "iter/sec",
            "range": "stddev: 0.00010631301010275421",
            "extra": "mean: 5.972816421428512 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 217.3754128317985,
            "unit": "iter/sec",
            "range": "stddev: 0.00011860079085659462",
            "extra": "mean: 4.600336289062201 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 96.12657206328268,
            "unit": "iter/sec",
            "range": "stddev: 0.00021977027079773137",
            "extra": "mean: 10.40295080263211 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.782748841415307,
            "unit": "iter/sec",
            "range": "stddev: 0.05889350038250334",
            "extra": "mean: 128.4893063333325 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.91834624250888,
            "unit": "iter/sec",
            "range": "stddev: 0.033712978503957367",
            "extra": "mean: 50.20497122727201 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.457341010375565,
            "unit": "iter/sec",
            "range": "stddev: 0.0010378060097256646",
            "extra": "mean: 24.121180365854368 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 130.46254735306655,
            "unit": "iter/sec",
            "range": "stddev: 0.00010010074057058856",
            "extra": "mean: 7.6650350639998805 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 225.32424746880443,
            "unit": "iter/sec",
            "range": "stddev: 0.00014392906082290595",
            "extra": "mean: 4.438048772973035 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 221.59752142912723,
            "unit": "iter/sec",
            "range": "stddev: 0.00012581436032252475",
            "extra": "mean: 4.512685852940943 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 186.16879333371747,
            "unit": "iter/sec",
            "range": "stddev: 0.00011644683431042269",
            "extra": "mean: 5.371469525547425 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 102.94856314214142,
            "unit": "iter/sec",
            "range": "stddev: 0.00017484591876382598",
            "extra": "mean: 9.713588703703387 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 151.22270859731316,
            "unit": "iter/sec",
            "range": "stddev: 0.014760401505581219",
            "extra": "mean: 6.612763448529894 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 237.2048223374911,
            "unit": "iter/sec",
            "range": "stddev: 0.0001105190346004286",
            "extra": "mean: 4.215765894410092 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 234.55339384086437,
            "unit": "iter/sec",
            "range": "stddev: 0.00011750564044731464",
            "extra": "mean: 4.263421575892704 msec\nrounds: 224"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 188.4716901771013,
            "unit": "iter/sec",
            "range": "stddev: 0.0008381676050932889",
            "extra": "mean: 5.305836643478549 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 212.36362842056965,
            "unit": "iter/sec",
            "range": "stddev: 0.0002205047102018283",
            "extra": "mean: 4.708904285716845 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a6e8a3f2eaca2995adb132ee104275336669d19c",
          "message": "Merge pull request #96 from stnkvcmls/claude/p2-3-streaming-tokens-65yku4\n\nfeat(p2-3): weight per-interval pace+distance scores into adherence score",
          "timestamp": "2026-06-27T08:22:06-07:00",
          "tree_id": "35bc7038bf91de4ef2e342a3ce5217e61042cef8",
          "url": "https://github.com/stnkvcmls/running-coach/commit/a6e8a3f2eaca2995adb132ee104275336669d19c"
        },
        "date": 1782573784621,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 377.6373773886833,
            "unit": "iter/sec",
            "range": "stddev: 0.00019269415436518435",
            "extra": "mean: 2.6480429636358527 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 19.70303922347073,
            "unit": "iter/sec",
            "range": "stddev: 0.03849253813122057",
            "extra": "mean: 50.75359129411752 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 27.637567026282273,
            "unit": "iter/sec",
            "range": "stddev: 0.020710561025690397",
            "extra": "mean: 36.182634999999756 msec\nrounds: 31"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.58605470776764,
            "unit": "iter/sec",
            "range": "stddev: 0.013467627282863822",
            "extra": "mean: 13.407332026315862 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 71.24517027267079,
            "unit": "iter/sec",
            "range": "stddev: 0.0006123598039439851",
            "extra": "mean: 14.036039161290262 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 158.8292638689255,
            "unit": "iter/sec",
            "range": "stddev: 0.00026431437536368147",
            "extra": "mean: 6.29606897142868 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 172.9091221160755,
            "unit": "iter/sec",
            "range": "stddev: 0.000442188890299372",
            "extra": "mean: 5.783384865771805 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 184.35300622267255,
            "unit": "iter/sec",
            "range": "stddev: 0.0002706125357241002",
            "extra": "mean: 5.424375878048554 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 127.84689144220086,
            "unit": "iter/sec",
            "range": "stddev: 0.00040238656009860705",
            "extra": "mean: 7.821856196261891 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 172.4987638161716,
            "unit": "iter/sec",
            "range": "stddev: 0.00033058993994367183",
            "extra": "mean: 5.7971429932430105 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 237.75382774455653,
            "unit": "iter/sec",
            "range": "stddev: 0.008102438100026334",
            "extra": "mean: 4.206031126760252 msec\nrounds: 213"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 124.48767783763252,
            "unit": "iter/sec",
            "range": "stddev: 0.011633206093308847",
            "extra": "mean: 8.03292355813951 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 208.7778110678843,
            "unit": "iter/sec",
            "range": "stddev: 0.00019493510384261813",
            "extra": "mean: 4.78978103508734 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 256.2452672469085,
            "unit": "iter/sec",
            "range": "stddev: 0.00018577783357492093",
            "extra": "mean: 3.9025111009618643 msec\nrounds: 208"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 266.4029342320272,
            "unit": "iter/sec",
            "range": "stddev: 0.00022686242669103468",
            "extra": "mean: 3.7537124089220306 msec\nrounds: 269"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 226.8957236394304,
            "unit": "iter/sec",
            "range": "stddev: 0.00017351399818373752",
            "extra": "mean: 4.407310917807964 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 110.5992963247322,
            "unit": "iter/sec",
            "range": "stddev: 0.0002257939991118937",
            "extra": "mean: 9.04164884615437 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.487800300659895,
            "unit": "iter/sec",
            "range": "stddev: 0.00044441261548008",
            "extra": "mean: 36.379775357142464 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 161.75643330946522,
            "unit": "iter/sec",
            "range": "stddev: 0.0002463171308977051",
            "extra": "mean: 6.182134333333404 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 203.9258440678738,
            "unit": "iter/sec",
            "range": "stddev: 0.0002528269610980137",
            "extra": "mean: 4.9037433414627145 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 91.09907676842637,
            "unit": "iter/sec",
            "range": "stddev: 0.0003110373228157783",
            "extra": "mean: 10.977059652777795 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.2587286087238025,
            "unit": "iter/sec",
            "range": "stddev: 0.04959553694606076",
            "extra": "mean: 159.77685924999818 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.552024286173882,
            "unit": "iter/sec",
            "range": "stddev: 0.03226206175825234",
            "extra": "mean: 51.14559931818134 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 31.205420131835076,
            "unit": "iter/sec",
            "range": "stddev: 0.0012140656452426794",
            "extra": "mean: 32.045714999998424 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 123.96828604108983,
            "unit": "iter/sec",
            "range": "stddev: 0.00030299553542229756",
            "extra": "mean: 8.066579219047568 msec\nrounds: 105"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 208.69195415900677,
            "unit": "iter/sec",
            "range": "stddev: 0.0002268177954518637",
            "extra": "mean: 4.791751574850265 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 191.4268562736717,
            "unit": "iter/sec",
            "range": "stddev: 0.0004972774679095101",
            "extra": "mean: 5.2239274021737 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 126.27824484985143,
            "unit": "iter/sec",
            "range": "stddev: 0.015196839424616434",
            "extra": "mean: 7.919020423423129 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 87.49121713584006,
            "unit": "iter/sec",
            "range": "stddev: 0.001339693469203895",
            "extra": "mean: 11.42971869333337 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 169.39852926461757,
            "unit": "iter/sec",
            "range": "stddev: 0.0004974851310714045",
            "extra": "mean: 5.903238973449996 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 218.0199958129394,
            "unit": "iter/sec",
            "range": "stddev: 0.0006515055798908433",
            "extra": "mean: 4.586735249999718 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 222.43883973914217,
            "unit": "iter/sec",
            "range": "stddev: 0.00028772125904859524",
            "extra": "mean: 4.4956177669903195 msec\nrounds: 206"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 187.5507111246126,
            "unit": "iter/sec",
            "range": "stddev: 0.00021688475543855335",
            "extra": "mean: 5.33189127358509 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 201.61655481597882,
            "unit": "iter/sec",
            "range": "stddev: 0.00018321038240833008",
            "extra": "mean: 4.959910166666266 msec\nrounds: 6"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f9ecd57d4a934ed5a13dfbf1cb807ecebc335056",
          "message": "Merge pull request #97 from stnkvcmls/claude/p1-1-improvement-phase-qdbnsz\n\nfeat(p1-1): race-day pacing strategy with per-km split plan and Garmin push",
          "timestamp": "2026-06-27T13:59:11-07:00",
          "tree_id": "813695df1a8c716b19873559fb7cae1528477b1e",
          "url": "https://github.com/stnkvcmls/running-coach/commit/f9ecd57d4a934ed5a13dfbf1cb807ecebc335056"
        },
        "date": 1782594001163,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 452.4093786022378,
            "unit": "iter/sec",
            "range": "stddev: 0.00018676464414426006",
            "extra": "mean: 2.2103874218735164 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 25.067756055638544,
            "unit": "iter/sec",
            "range": "stddev: 0.02445619019769004",
            "extra": "mean: 39.89188333333362 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 29.10820844475103,
            "unit": "iter/sec",
            "range": "stddev: 0.019276653238135145",
            "extra": "mean: 34.354570529411134 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 84.52517896711822,
            "unit": "iter/sec",
            "range": "stddev: 0.009081495407314403",
            "extra": "mean: 11.830794234567874 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 87.3039268389649,
            "unit": "iter/sec",
            "range": "stddev: 0.00024407127863542883",
            "extra": "mean: 11.454238499999368 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 177.98434032564035,
            "unit": "iter/sec",
            "range": "stddev: 0.00014292172974974266",
            "extra": "mean: 5.618471817073338 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 196.33025822424585,
            "unit": "iter/sec",
            "range": "stddev: 0.0001187982563671138",
            "extra": "mean: 5.093458385094228 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 230.0447479454336,
            "unit": "iter/sec",
            "range": "stddev: 0.00013321176409271507",
            "extra": "mean: 4.34698035460996 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 156.66170432287794,
            "unit": "iter/sec",
            "range": "stddev: 0.0001900417448407293",
            "extra": "mean: 6.383180907690189 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 194.15156234836036,
            "unit": "iter/sec",
            "range": "stddev: 0.006992277216674648",
            "extra": "mean: 5.150615261110955 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 322.7411180692897,
            "unit": "iter/sec",
            "range": "stddev: 0.00009586803870676274",
            "extra": "mean: 3.098458622137229 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 161.15315404864322,
            "unit": "iter/sec",
            "range": "stddev: 0.00012982796506527572",
            "extra": "mean: 6.205277246377414 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 251.39067619960392,
            "unit": "iter/sec",
            "range": "stddev: 0.00013528063430623443",
            "extra": "mean: 3.977872270831561 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 297.9463097175119,
            "unit": "iter/sec",
            "range": "stddev: 0.00010765680768937506",
            "extra": "mean: 3.3563093999993407 msec\nrounds: 235"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 307.553642123233,
            "unit": "iter/sec",
            "range": "stddev: 0.00011047699416414438",
            "extra": "mean: 3.2514653154369486 msec\nrounds: 298"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 229.01950442264987,
            "unit": "iter/sec",
            "range": "stddev: 0.0070849792114843985",
            "extra": "mean: 4.36644032795794 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 135.18840145324586,
            "unit": "iter/sec",
            "range": "stddev: 0.0003067479998062261",
            "extra": "mean: 7.397084285709558 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 30.505723704537377,
            "unit": "iter/sec",
            "range": "stddev: 0.0002872557404642742",
            "extra": "mean: 32.780733533335635 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 190.58239672128292,
            "unit": "iter/sec",
            "range": "stddev: 0.00016810659519919842",
            "extra": "mean: 5.247074321677512 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 228.08485592189822,
            "unit": "iter/sec",
            "range": "stddev: 0.00009899888132664928",
            "extra": "mean: 4.384333172661075 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 115.35517032493097,
            "unit": "iter/sec",
            "range": "stddev: 0.0001415226574743749",
            "extra": "mean: 8.668878882352761 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.341425416587231,
            "unit": "iter/sec",
            "range": "stddev: 0.004755837994442556",
            "extra": "mean: 107.05004379998968 msec\nrounds: 10"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.951971400551976,
            "unit": "iter/sec",
            "range": "stddev: 0.020364531660102415",
            "extra": "mean: 43.56924215999811 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 43.217220337638864,
            "unit": "iter/sec",
            "range": "stddev: 0.0007024833643930715",
            "extra": "mean: 23.138924534882154 msec\nrounds: 43"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 123.0579946945886,
            "unit": "iter/sec",
            "range": "stddev: 0.008701512010060402",
            "extra": "mean: 8.126249761194707 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 234.33255221433706,
            "unit": "iter/sec",
            "range": "stddev: 0.00010418462821610592",
            "extra": "mean: 4.267439544998979 msec\nrounds: 200"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 229.80973709319085,
            "unit": "iter/sec",
            "range": "stddev: 0.00017724650094052017",
            "extra": "mean: 4.351425716981204 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 194.89922942172578,
            "unit": "iter/sec",
            "range": "stddev: 0.00010100882258922127",
            "extra": "mean: 5.1308566122454256 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 120.85127876974286,
            "unit": "iter/sec",
            "range": "stddev: 0.00041626372920463493",
            "extra": "mean: 8.274633170454848 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 195.6137459384236,
            "unit": "iter/sec",
            "range": "stddev: 0.0001109401536324314",
            "extra": "mean: 5.112115179854414 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 247.6339754330974,
            "unit": "iter/sec",
            "range": "stddev: 0.00012475359165505475",
            "extra": "mean: 4.038218092856839 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 247.80878247063544,
            "unit": "iter/sec",
            "range": "stddev: 0.00010580243857746929",
            "extra": "mean: 4.035369489450991 msec\nrounds: 237"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 208.6300698264011,
            "unit": "iter/sec",
            "range": "stddev: 0.00011528994899100871",
            "extra": "mean: 4.793172915256605 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 220.22811605802542,
            "unit": "iter/sec",
            "range": "stddev: 0.0003278843488684752",
            "extra": "mean: 4.540746285712771 msec\nrounds: 14"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c23ace7345b907a0b97c21650bae9e43ad29bb83",
          "message": "Merge pull request #98 from stnkvcmls/claude/item-p1-2-y7eii5\n\nfeat(P1-2): add durability/endurance score (fatigue-resistance index)",
          "timestamp": "2026-06-28T21:46:40-07:00",
          "tree_id": "e394bf840cbcf22d66d687afac3bdaf19fc45123",
          "url": "https://github.com/stnkvcmls/running-coach/commit/c23ace7345b907a0b97c21650bae9e43ad29bb83"
        },
        "date": 1782708452549,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 397.1609624468323,
            "unit": "iter/sec",
            "range": "stddev: 0.00015555461999385394",
            "extra": "mean: 2.517870824562395 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 22.714261298618855,
            "unit": "iter/sec",
            "range": "stddev: 0.03058305050506624",
            "extra": "mean: 44.02520455555406 msec\nrounds: 18"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 30.907245156504533,
            "unit": "iter/sec",
            "range": "stddev: 0.016863661008464266",
            "extra": "mean: 32.35487326470915 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 76.30773621794977,
            "unit": "iter/sec",
            "range": "stddev: 0.014327895654558736",
            "extra": "mean: 13.10483116867476 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 83.44881247787679,
            "unit": "iter/sec",
            "range": "stddev: 0.00018007810608957947",
            "extra": "mean: 11.983394014925153 msec\nrounds: 67"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 168.76003147256333,
            "unit": "iter/sec",
            "range": "stddev: 0.00006187226994278414",
            "extra": "mean: 5.925573675675558 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 185.7812627018019,
            "unit": "iter/sec",
            "range": "stddev: 0.00007234383879835255",
            "extra": "mean: 5.382674148388706 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 199.46517066221733,
            "unit": "iter/sec",
            "range": "stddev: 0.000220613006607118",
            "extra": "mean: 5.013406584618434 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 128.8750659229988,
            "unit": "iter/sec",
            "range": "stddev: 0.009385011096698313",
            "extra": "mean: 7.759452868854299 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 192.74766856078264,
            "unit": "iter/sec",
            "range": "stddev: 0.00015419275123395906",
            "extra": "mean: 5.188130198755954 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 294.02746936023084,
            "unit": "iter/sec",
            "range": "stddev: 0.00011147198075789355",
            "extra": "mean: 3.401042773914568 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 137.58657710133946,
            "unit": "iter/sec",
            "range": "stddev: 0.009014936996341233",
            "extra": "mean: 7.268150869568108 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 224.93681483535437,
            "unit": "iter/sec",
            "range": "stddev: 0.00010509047712094007",
            "extra": "mean: 4.445692897056286 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 268.896344581892,
            "unit": "iter/sec",
            "range": "stddev: 0.00011456233293784722",
            "extra": "mean: 3.718905147464552 msec\nrounds: 217"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 281.56428416045947,
            "unit": "iter/sec",
            "range": "stddev: 0.00010138239113574218",
            "extra": "mean: 3.5515868178441066 msec\nrounds: 269"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 240.01617562578414,
            "unit": "iter/sec",
            "range": "stddev: 0.00010882987617986763",
            "extra": "mean: 4.166385858756152 msec\nrounds: 177"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 123.43412461407083,
            "unit": "iter/sec",
            "range": "stddev: 0.00011174320272800107",
            "extra": "mean: 8.10148735713564 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.571704749607793,
            "unit": "iter/sec",
            "range": "stddev: 0.00028123961929197737",
            "extra": "mean: 33.81610929999776 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 174.22905145655258,
            "unit": "iter/sec",
            "range": "stddev: 0.00010280124848487522",
            "extra": "mean: 5.739570936304899 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 212.74341016984593,
            "unit": "iter/sec",
            "range": "stddev: 0.0000995573588242715",
            "extra": "mean: 4.700498122135203 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 80.08023253060955,
            "unit": "iter/sec",
            "range": "stddev: 0.00014099441780196105",
            "extra": "mean: 12.487476227266997 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.569690167121065,
            "unit": "iter/sec",
            "range": "stddev: 0.04324230811474306",
            "extra": "mean: 152.21417975000406 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.772345605800165,
            "unit": "iter/sec",
            "range": "stddev: 0.02560047401599181",
            "extra": "mean: 45.92982392000977 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 35.328141127731136,
            "unit": "iter/sec",
            "range": "stddev: 0.0007123774662413722",
            "extra": "mean: 28.306046343747227 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 131.11967308240096,
            "unit": "iter/sec",
            "range": "stddev: 0.00011467956376095805",
            "extra": "mean: 7.626620601559608 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 217.5514671052841,
            "unit": "iter/sec",
            "range": "stddev: 0.0001689718984863064",
            "extra": "mean: 4.596613451087644 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 214.57119853587687,
            "unit": "iter/sec",
            "range": "stddev: 0.0002644849406477718",
            "extra": "mean: 4.660457726029794 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 180.88086048780988,
            "unit": "iter/sec",
            "range": "stddev: 0.00015053703138185893",
            "extra": "mean: 5.5285009000020375 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 108.64359594113833,
            "unit": "iter/sec",
            "range": "stddev: 0.00014396987995825183",
            "extra": "mean: 9.204408150681857 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 183.25994165050278,
            "unit": "iter/sec",
            "range": "stddev: 0.00012379398031245052",
            "extra": "mean: 5.456729883212077 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 233.40614969983713,
            "unit": "iter/sec",
            "range": "stddev: 0.00010964090893495841",
            "extra": "mean: 4.284377259493852 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 200.26799863579774,
            "unit": "iter/sec",
            "range": "stddev: 0.009634639491167973",
            "extra": "mean: 4.993308999999418 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 195.4387747070959,
            "unit": "iter/sec",
            "range": "stddev: 0.00011909932272556184",
            "extra": "mean: 5.116691923077701 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 188.40021491660764,
            "unit": "iter/sec",
            "range": "stddev: 0.0005279327755558137",
            "extra": "mean: 5.307849571417072 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "de777bfc1aab76e3ad2d2490a25aed6791d17bc1",
          "message": "Merge pull request #99 from stnkvcmls/claude/item-p1-3-vr8o9f\n\nP1-3: Harden AI plan generation with structured output",
          "timestamp": "2026-06-29T07:25:31+02:00",
          "tree_id": "b97f91b770276e81c2ac1d776bef530b24852cb2",
          "url": "https://github.com/stnkvcmls/running-coach/commit/de777bfc1aab76e3ad2d2490a25aed6791d17bc1"
        },
        "date": 1782710788950,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 370.57358537542694,
            "unit": "iter/sec",
            "range": "stddev: 0.000213855512761154",
            "extra": "mean: 2.6985193750032215 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 21.106014094693336,
            "unit": "iter/sec",
            "range": "stddev: 0.0355686291355804",
            "extra": "mean: 47.37986033333641 msec\nrounds: 18"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 28.86449354804481,
            "unit": "iter/sec",
            "range": "stddev: 0.018874844349139077",
            "extra": "mean: 34.64464042424665 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 77.92896486515535,
            "unit": "iter/sec",
            "range": "stddev: 0.012859364824379438",
            "extra": "mean: 12.832199192307424 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 79.35292155470331,
            "unit": "iter/sec",
            "range": "stddev: 0.00018266323286409737",
            "extra": "mean: 12.60193046970089 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 161.0810624073787,
            "unit": "iter/sec",
            "range": "stddev: 0.0001875538486582032",
            "extra": "mean: 6.208054410958446 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 177.94238698122277,
            "unit": "iter/sec",
            "range": "stddev: 0.00011253795978406192",
            "extra": "mean: 5.619796480000711 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 188.54466510513063,
            "unit": "iter/sec",
            "range": "stddev: 0.00022282318381721127",
            "extra": "mean: 5.303783055555616 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 136.5391496427546,
            "unit": "iter/sec",
            "range": "stddev: 0.00029019913212051217",
            "extra": "mean: 7.3239067521398225 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 160.55830068749725,
            "unit": "iter/sec",
            "range": "stddev: 0.009387807075443696",
            "extra": "mean: 6.228267213330507 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 278.7972925921361,
            "unit": "iter/sec",
            "range": "stddev: 0.00014892997344509846",
            "extra": "mean: 3.586835405403096 msec\nrounds: 222"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 129.5032409630677,
            "unit": "iter/sec",
            "range": "stddev: 0.01058053686519568",
            "extra": "mean: 7.721814470150477 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.16012689044763,
            "unit": "iter/sec",
            "range": "stddev: 0.00011605602880575534",
            "extra": "mean: 4.647701293228771 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 255.98025980219987,
            "unit": "iter/sec",
            "range": "stddev: 0.00013458184947850828",
            "extra": "mean: 3.90655123474254 msec\nrounds: 213"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 267.3411470371884,
            "unit": "iter/sec",
            "range": "stddev: 0.00015622912724464733",
            "extra": "mean: 3.740539049385074 msec\nrounds: 243"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 231.2899253008654,
            "unit": "iter/sec",
            "range": "stddev: 0.0001462918542774801",
            "extra": "mean: 4.323577858824525 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 112.96872930838954,
            "unit": "iter/sec",
            "range": "stddev: 0.00031377579894501206",
            "extra": "mean: 8.852007153857008 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.178803837524512,
            "unit": "iter/sec",
            "range": "stddev: 0.0012367066486912337",
            "extra": "mean: 35.487666750010966 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 158.9176631732674,
            "unit": "iter/sec",
            "range": "stddev: 0.0009842108183057635",
            "extra": "mean: 6.292566729411968 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 205.6247310242851,
            "unit": "iter/sec",
            "range": "stddev: 0.0001482184567262414",
            "extra": "mean: 4.8632282460318255 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 75.14148741734496,
            "unit": "iter/sec",
            "range": "stddev: 0.0003550804070565656",
            "extra": "mean: 13.308227377053084 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.083709032599603,
            "unit": "iter/sec",
            "range": "stddev: 0.006876143640817845",
            "extra": "mean: 141.16898300000003 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.832082396425452,
            "unit": "iter/sec",
            "range": "stddev: 0.032119223617479965",
            "extra": "mean: 50.42334839130361 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.14614346606412,
            "unit": "iter/sec",
            "range": "stddev: 0.001961468819707904",
            "extra": "mean: 31.107930600001055 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 108.31011747978695,
            "unit": "iter/sec",
            "range": "stddev: 0.013592632297536093",
            "extra": "mean: 9.232747810347652 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.21231064057014,
            "unit": "iter/sec",
            "range": "stddev: 0.0002178207525616004",
            "extra": "mean: 4.757095324021447 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 199.66122630123724,
            "unit": "iter/sec",
            "range": "stddev: 0.0007453167034843647",
            "extra": "mean: 5.008483712762828 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 175.37548534665822,
            "unit": "iter/sec",
            "range": "stddev: 0.00021778898043632155",
            "extra": "mean: 5.702051218979307 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 99.29840525582374,
            "unit": "iter/sec",
            "range": "stddev: 0.00043018181379832237",
            "extra": "mean: 10.07065518749961 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 175.8288847251108,
            "unit": "iter/sec",
            "range": "stddev: 0.00047463455970799543",
            "extra": "mean: 5.687347682170596 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.00701549180098,
            "unit": "iter/sec",
            "range": "stddev: 0.0001493701819614459",
            "extra": "mean: 4.405150201343085 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 224.80283330306074,
            "unit": "iter/sec",
            "range": "stddev: 0.00015844105325579338",
            "extra": "mean: 4.44834251111009 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 187.37224986019643,
            "unit": "iter/sec",
            "range": "stddev: 0.0001709611336174685",
            "extra": "mean: 5.336969592595101 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 193.13817052315034,
            "unit": "iter/sec",
            "range": "stddev: 0.000421533583844089",
            "extra": "mean: 5.177640428566325 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "34754cafc8541777dd2d25cb840551b20ce90380",
          "message": "Merge pull request #100 from stnkvcmls/claude/p2-1-implementation-jav28b\n\nfeat(P2-1): durable AI task queue replacing daemon threads",
          "timestamp": "2026-06-29T16:25:30+02:00",
          "tree_id": "1734104af727e7817a63227493a50f9b8497420f",
          "url": "https://github.com/stnkvcmls/running-coach/commit/34754cafc8541777dd2d25cb840551b20ce90380"
        },
        "date": 1782743186237,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 423.1939673830502,
            "unit": "iter/sec",
            "range": "stddev: 0.00016782829085186114",
            "extra": "mean: 2.362982644066991 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 21.538481767092303,
            "unit": "iter/sec",
            "range": "stddev: 0.03598786413534363",
            "extra": "mean: 46.428527823528206 msec\nrounds: 17"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 30.672385845573274,
            "unit": "iter/sec",
            "range": "stddev: 0.018438111402157162",
            "extra": "mean: 32.60261542857198 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.3995158610931,
            "unit": "iter/sec",
            "range": "stddev: 0.016177782419831237",
            "extra": "mean: 13.440947678571462 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 81.0896290551002,
            "unit": "iter/sec",
            "range": "stddev: 0.00013699158687829915",
            "extra": "mean: 12.332033228571099 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 172.03832452896643,
            "unit": "iter/sec",
            "range": "stddev: 0.00006566042555894849",
            "extra": "mean: 5.812658329113337 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 165.44651295113283,
            "unit": "iter/sec",
            "range": "stddev: 0.008998666380661257",
            "extra": "mean: 6.044249480769445 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 202.00136008592844,
            "unit": "iter/sec",
            "range": "stddev: 0.00013172385177636118",
            "extra": "mean: 4.950461717557815 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 143.90806705829934,
            "unit": "iter/sec",
            "range": "stddev: 0.00007808177988343325",
            "extra": "mean: 6.948880771186266 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 190.37760003639792,
            "unit": "iter/sec",
            "range": "stddev: 0.000134433799353154",
            "extra": "mean: 5.252718806250378 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 305.97180040735645,
            "unit": "iter/sec",
            "range": "stddev: 0.00012027887782575332",
            "extra": "mean: 3.2682750458331356 msec\nrounds: 240"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 136.39330273651257,
            "unit": "iter/sec",
            "range": "stddev: 0.010321866617540006",
            "extra": "mean: 7.3317382887327005 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 228.00688751220403,
            "unit": "iter/sec",
            "range": "stddev: 0.0006898576647023896",
            "extra": "mean: 4.385832423358155 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 280.7312759396142,
            "unit": "iter/sec",
            "range": "stddev: 0.000135647601236608",
            "extra": "mean: 3.5621253693696096 msec\nrounds: 222"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 292.1547206985155,
            "unit": "iter/sec",
            "range": "stddev: 0.00009977690909605224",
            "extra": "mean: 3.422843887680782 msec\nrounds: 276"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 248.77466041019474,
            "unit": "iter/sec",
            "range": "stddev: 0.00010251131983677642",
            "extra": "mean: 4.019701999999274 msec\nrounds: 178"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 116.77451182080218,
            "unit": "iter/sec",
            "range": "stddev: 0.00012542623443203952",
            "extra": "mean: 8.563512571429653 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 25.37639025505517,
            "unit": "iter/sec",
            "range": "stddev: 0.02570723574525627",
            "extra": "mean: 39.40670796551895 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.03471614405794,
            "unit": "iter/sec",
            "range": "stddev: 0.0002387731049812938",
            "extra": "mean: 5.98677941379298 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 215.60736743957293,
            "unit": "iter/sec",
            "range": "stddev: 0.000248203837681465",
            "extra": "mean: 4.638060433070611 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 72.96696234033669,
            "unit": "iter/sec",
            "range": "stddev: 0.0007492496149040157",
            "extra": "mean: 13.704832542373666 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.220094951898066,
            "unit": "iter/sec",
            "range": "stddev: 0.0038537580139550768",
            "extra": "mean: 108.45875288888844 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.141962813310197,
            "unit": "iter/sec",
            "range": "stddev: 0.031528040062837666",
            "extra": "mean: 49.64759439130632 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.73646798272386,
            "unit": "iter/sec",
            "range": "stddev: 0.0013674041940889778",
            "extra": "mean: 23.9598616829276 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 130.11319646157057,
            "unit": "iter/sec",
            "range": "stddev: 0.00010632670456789186",
            "extra": "mean: 7.6856155039996565 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 224.19747658734505,
            "unit": "iter/sec",
            "range": "stddev: 0.00013330785668509525",
            "extra": "mean: 4.460353502731821 msec\nrounds: 183"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 219.24639165780928,
            "unit": "iter/sec",
            "range": "stddev: 0.00012559637388422104",
            "extra": "mean: 4.561078485436416 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 185.7532056494426,
            "unit": "iter/sec",
            "range": "stddev: 0.00010971941820279852",
            "extra": "mean: 5.383487173229308 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 102.66198834544937,
            "unit": "iter/sec",
            "range": "stddev: 0.0001698651855308133",
            "extra": "mean: 9.74070360526313 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 195.3772170723882,
            "unit": "iter/sec",
            "range": "stddev: 0.00015512208981692904",
            "extra": "mean: 5.118304042735419 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 226.08164246899972,
            "unit": "iter/sec",
            "range": "stddev: 0.0003877395162954933",
            "extra": "mean: 4.423180887573037 msec\nrounds: 169"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 174.35811846195568,
            "unit": "iter/sec",
            "range": "stddev: 0.0022535533608196573",
            "extra": "mean: 5.73532227131825 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 157.6212402877792,
            "unit": "iter/sec",
            "range": "stddev: 0.00016079818557503825",
            "extra": "mean: 6.344322619047001 msec\nrounds: 105"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 214.38179752767212,
            "unit": "iter/sec",
            "range": "stddev: 0.00016063606495723764",
            "extra": "mean: 4.664575124998294 msec\nrounds: 8"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "12e9e6e071c98f244b3111945d157df1d49cd700",
          "message": "Merge pull request #101 from stnkvcmls/claude/p3-2-implementation-68349p\n\nfeat(P3-2): incremental CTL/ATL/TSB and CP/CV compute",
          "timestamp": "2026-06-29T17:15:47+02:00",
          "tree_id": "1a06b166c24205089e13a2ae7d35af03d3cae981",
          "url": "https://github.com/stnkvcmls/running-coach/commit/12e9e6e071c98f244b3111945d157df1d49cd700"
        },
        "date": 1782746203527,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 413.9916154868528,
            "unit": "iter/sec",
            "range": "stddev: 0.00012528205165753523",
            "extra": "mean: 2.4155078571434427 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 83.38544506717692,
            "unit": "iter/sec",
            "range": "stddev: 0.0007443825950071863",
            "extra": "mean: 11.99250060000736 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 76.59897248549963,
            "unit": "iter/sec",
            "range": "stddev: 0.01673270970593837",
            "extra": "mean: 13.05500540740677 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 85.37845867273386,
            "unit": "iter/sec",
            "range": "stddev: 0.001879767975081841",
            "extra": "mean: 11.712556253013693 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 76.81197081618375,
            "unit": "iter/sec",
            "range": "stddev: 0.00046096758275766657",
            "extra": "mean: 13.018804092308319 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 170.76463066311302,
            "unit": "iter/sec",
            "range": "stddev: 0.00011660606919130479",
            "extra": "mean: 5.856013602563956 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 158.19842028236457,
            "unit": "iter/sec",
            "range": "stddev: 0.011843134854034527",
            "extra": "mean: 6.3211756363630185 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 193.59442301790722,
            "unit": "iter/sec",
            "range": "stddev: 0.0001541374624423887",
            "extra": "mean: 5.165438055555461 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.29140621241876,
            "unit": "iter/sec",
            "range": "stddev: 0.0001860294348132681",
            "extra": "mean: 7.283777095652943 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 186.3623292362062,
            "unit": "iter/sec",
            "range": "stddev: 0.0001396134845614548",
            "extra": "mean: 5.365891294117404 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 302.3297769786328,
            "unit": "iter/sec",
            "range": "stddev: 0.00011936822083829256",
            "extra": "mean: 3.3076464051725707 msec\nrounds: 232"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 125.62492272461024,
            "unit": "iter/sec",
            "range": "stddev: 0.015411595292825856",
            "extra": "mean: 7.960203901515295 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 231.0547497747567,
            "unit": "iter/sec",
            "range": "stddev: 0.00015565223173490868",
            "extra": "mean: 4.3279785461015114 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 277.7085831986507,
            "unit": "iter/sec",
            "range": "stddev: 0.0001918864049189982",
            "extra": "mean: 3.6008969851849315 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 287.19710791804715,
            "unit": "iter/sec",
            "range": "stddev: 0.00011549944205989177",
            "extra": "mean: 3.4819292131777106 msec\nrounds: 258"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 244.9894889709074,
            "unit": "iter/sec",
            "range": "stddev: 0.00013315692129164345",
            "extra": "mean: 4.081807771429535 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 112.2481816275276,
            "unit": "iter/sec",
            "range": "stddev: 0.0003073108099403105",
            "extra": "mean: 8.908830285717174 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.128283904942013,
            "unit": "iter/sec",
            "range": "stddev: 0.0012638727494518906",
            "extra": "mean: 35.551404535713765 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 162.04560118885115,
            "unit": "iter/sec",
            "range": "stddev: 0.00024037084125521938",
            "extra": "mean: 6.17110240983697 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 215.57216638534183,
            "unit": "iter/sec",
            "range": "stddev: 0.00011331395546499952",
            "extra": "mean: 4.638817787879301 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 71.60475439765985,
            "unit": "iter/sec",
            "range": "stddev: 0.0005383343475044974",
            "extra": "mean: 13.965553103449812 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.062312945931012,
            "unit": "iter/sec",
            "range": "stddev: 0.004115581129190943",
            "extra": "mean: 110.34710520000317 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 18.29636227051648,
            "unit": "iter/sec",
            "range": "stddev: 0.04451435065883485",
            "extra": "mean: 54.65567336363041 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.628308576117895,
            "unit": "iter/sec",
            "range": "stddev: 0.001191744395029297",
            "extra": "mean: 25.234486051283366 msec\nrounds: 39"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.62383006162763,
            "unit": "iter/sec",
            "range": "stddev: 0.00021169320297643695",
            "extra": "mean: 7.897407616823006 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 223.44638049951993,
            "unit": "iter/sec",
            "range": "stddev: 0.00012317514685787498",
            "extra": "mean: 4.475346603352783 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 219.0106657218828,
            "unit": "iter/sec",
            "range": "stddev: 0.00013659794047828934",
            "extra": "mean: 4.565987673266469 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 141.87062669960227,
            "unit": "iter/sec",
            "range": "stddev: 0.018071355095722916",
            "extra": "mean: 7.04867542537474 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 100.28259621683809,
            "unit": "iter/sec",
            "range": "stddev: 0.00021482167702422685",
            "extra": "mean: 9.971820013890841 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 187.37412711554867,
            "unit": "iter/sec",
            "range": "stddev: 0.0006143569508856268",
            "extra": "mean: 5.3369161228077475 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 235.43492333589228,
            "unit": "iter/sec",
            "range": "stddev: 0.0001593526442903961",
            "extra": "mean: 4.247458218309063 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 184.9960195999198,
            "unit": "iter/sec",
            "range": "stddev: 0.00032377124587832236",
            "extra": "mean: 5.405521708859694 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 160.5846045865319,
            "unit": "iter/sec",
            "range": "stddev: 0.0001766344260360309",
            "extra": "mean: 6.227247017699909 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 209.6052943665813,
            "unit": "iter/sec",
            "range": "stddev: 0.000224926267021638",
            "extra": "mean: 4.770871857134905 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b64babb4b68ef47d4279a29981da8d0b4d2b5d91",
          "message": "Merge pull request #102 from stnkvcmls/claude/p3-5-implementation-9p27j5\n\nfeat(P3-5): infinite scroll for activities and daily summaries history",
          "timestamp": "2026-06-29T20:32:02+02:00",
          "tree_id": "98fd8cab1d12b72ca0fe038e3a00efc6bbfadadc",
          "url": "https://github.com/stnkvcmls/running-coach/commit/b64babb4b68ef47d4279a29981da8d0b4d2b5d91"
        },
        "date": 1782757981439,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 536.1003320626628,
            "unit": "iter/sec",
            "range": "stddev: 0.00012704967765270257",
            "extra": "mean: 1.8653224782616133 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 108.86100968107888,
            "unit": "iter/sec",
            "range": "stddev: 0.0008713273449138965",
            "extra": "mean: 9.186025399999664 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 99.12310526673195,
            "unit": "iter/sec",
            "range": "stddev: 0.012104233778114912",
            "extra": "mean: 10.088465220183366 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 85.86992055365968,
            "unit": "iter/sec",
            "range": "stddev: 0.018852966920345198",
            "extra": "mean: 11.64552142999952 msec\nrounds: 100"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 86.13096523542652,
            "unit": "iter/sec",
            "range": "stddev: 0.013476142877145339",
            "extra": "mean: 11.610226325301765 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 218.16684917131641,
            "unit": "iter/sec",
            "range": "stddev: 0.0001448296113903369",
            "extra": "mean: 4.583647808080805 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 232.8233828514062,
            "unit": "iter/sec",
            "range": "stddev: 0.00016562965918797643",
            "extra": "mean: 4.295101238341792 msec\nrounds: 193"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 237.1914718453217,
            "unit": "iter/sec",
            "range": "stddev: 0.00024079593235413867",
            "extra": "mean: 4.216003181818122 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 172.19599312744467,
            "unit": "iter/sec",
            "range": "stddev: 0.000257599612175456",
            "extra": "mean: 5.807336058394147 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 231.09959924809448,
            "unit": "iter/sec",
            "range": "stddev: 0.00021538356979446149",
            "extra": "mean: 4.3271386157899 msec\nrounds: 190"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 378.3735311066507,
            "unit": "iter/sec",
            "range": "stddev: 0.00010752021943008638",
            "extra": "mean: 2.642891000000034 msec\nrounds: 287"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 190.08791973617943,
            "unit": "iter/sec",
            "range": "stddev: 0.00029526239532756123",
            "extra": "mean: 5.260723571428879 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 297.80971181761515,
            "unit": "iter/sec",
            "range": "stddev: 0.00015201770048207876",
            "extra": "mean: 3.35784885555519 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 341.28990259913337,
            "unit": "iter/sec",
            "range": "stddev: 0.00044560494125063413",
            "extra": "mean: 2.930060316418337 msec\nrounds: 335"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 362.5998221014697,
            "unit": "iter/sec",
            "range": "stddev: 0.0000969306565657482",
            "extra": "mean: 2.757861253776789 msec\nrounds: 331"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 306.5566228786741,
            "unit": "iter/sec",
            "range": "stddev: 0.000101667875050975",
            "extra": "mean: 3.2620401105989805 msec\nrounds: 217"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 125.09340481307802,
            "unit": "iter/sec",
            "range": "stddev: 0.00032582832059244784",
            "extra": "mean: 7.994026555550704 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 34.734112377180054,
            "unit": "iter/sec",
            "range": "stddev: 0.0005680079127002206",
            "extra": "mean: 28.79014120588236 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 175.36755464851487,
            "unit": "iter/sec",
            "range": "stddev: 0.0005552094014626659",
            "extra": "mean: 5.702309084506977 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 261.1233835852989,
            "unit": "iter/sec",
            "range": "stddev: 0.0002341473471859774",
            "extra": "mean: 3.829607238806856 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 88.74117990319664,
            "unit": "iter/sec",
            "range": "stddev: 0.001077817825743827",
            "extra": "mean: 11.268725535212068 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.69929951182034,
            "unit": "iter/sec",
            "range": "stddev: 0.054255441040757996",
            "extra": "mean: 103.10022891666766 msec\nrounds: 12"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 25.047003054787776,
            "unit": "iter/sec",
            "range": "stddev: 0.030111991447384377",
            "extra": "mean: 39.92493624137792 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 51.40696385568746,
            "unit": "iter/sec",
            "range": "stddev: 0.0010661617881518354",
            "extra": "mean: 19.452617408163935 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 155.15418443751153,
            "unit": "iter/sec",
            "range": "stddev: 0.00033190913274667994",
            "extra": "mean: 6.445201614286792 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 264.79650155689643,
            "unit": "iter/sec",
            "range": "stddev: 0.0003431012326324761",
            "extra": "mean: 3.776484938888558 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 272.86885316273435,
            "unit": "iter/sec",
            "range": "stddev: 0.0001314639302390911",
            "extra": "mean: 3.664764184000205 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 225.08900670896148,
            "unit": "iter/sec",
            "range": "stddev: 0.00019506473672267226",
            "extra": "mean: 4.442686982456647 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 117.32718167626322,
            "unit": "iter/sec",
            "range": "stddev: 0.0008012209707604572",
            "extra": "mean: 8.5231741333331 msec\nrounds: 90"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 50.905040476012424,
            "unit": "iter/sec",
            "range": "stddev: 0.035688450976327384",
            "extra": "mean: 19.64442009374734 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 291.0502813201115,
            "unit": "iter/sec",
            "range": "stddev: 0.0001333071124522454",
            "extra": "mean: 3.4358324460787952 msec\nrounds: 204"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 66.82349898343753,
            "unit": "iter/sec",
            "range": "stddev: 0.028352260701145993",
            "extra": "mean: 14.96479554666621 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 90.84961006457189,
            "unit": "iter/sec",
            "range": "stddev: 0.02027012368042538",
            "extra": "mean: 11.007201894309114 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 256.9673295777325,
            "unit": "iter/sec",
            "range": "stddev: 0.00016559972866574178",
            "extra": "mean: 3.8915452857111177 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "a50e83a247e64135befbfdc40192b597fc18e8f6",
          "message": "Merge pull request #103 from stnkvcmls/claude/p3-4-implementation-86qxz5\n\nfeat(P3-4): add Garmin schema-drift canary with contract tests",
          "timestamp": "2026-06-29T22:04:41+02:00",
          "tree_id": "a548421282f3f453ac672bcfbdc15f2c73f81335",
          "url": "https://github.com/stnkvcmls/running-coach/commit/a50e83a247e64135befbfdc40192b597fc18e8f6"
        },
        "date": 1782763539447,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 396.32115964430005,
            "unit": "iter/sec",
            "range": "stddev: 0.0002282249594180368",
            "extra": "mean: 2.5232061818185643 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 86.73122268160607,
            "unit": "iter/sec",
            "range": "stddev: 0.0007348959699280375",
            "extra": "mean: 11.529873200001362 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 78.0698905862202,
            "unit": "iter/sec",
            "range": "stddev: 0.015224672935550583",
            "extra": "mean: 12.809035499999867 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 69.56486639665214,
            "unit": "iter/sec",
            "range": "stddev: 0.02159265301546789",
            "extra": "mean: 14.375072530120258 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 79.56114437806215,
            "unit": "iter/sec",
            "range": "stddev: 0.0002548295999454693",
            "extra": "mean: 12.56894942647074 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 167.542826148052,
            "unit": "iter/sec",
            "range": "stddev: 0.00018594164956087448",
            "extra": "mean: 5.968623205128063 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 186.21937685421682,
            "unit": "iter/sec",
            "range": "stddev: 0.00022720960363941818",
            "extra": "mean: 5.370010451612977 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 195.70405366221138,
            "unit": "iter/sec",
            "range": "stddev: 0.00018106162470897454",
            "extra": "mean: 5.109756192000077 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 138.26547657298852,
            "unit": "iter/sec",
            "range": "stddev: 0.00020841282948064885",
            "extra": "mean: 7.232463408695613 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 184.43401322826762,
            "unit": "iter/sec",
            "range": "stddev: 0.0002451579996871797",
            "extra": "mean: 5.421993386666344 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 240.43082060518867,
            "unit": "iter/sec",
            "range": "stddev: 0.011496877206793377",
            "extra": "mean: 4.159200544601141 msec\nrounds: 213"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 152.84181099705273,
            "unit": "iter/sec",
            "range": "stddev: 0.00016019282137234606",
            "extra": "mean: 6.542712321167688 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 167.67336929575944,
            "unit": "iter/sec",
            "range": "stddev: 0.01710054334183211",
            "extra": "mean: 5.96397629629603 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 270.19048158763246,
            "unit": "iter/sec",
            "range": "stddev: 0.00042939380833615227",
            "extra": "mean: 3.701092629629383 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 287.58619190226415,
            "unit": "iter/sec",
            "range": "stddev: 0.000133017154674494",
            "extra": "mean: 3.4772184067163034 msec\nrounds: 268"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 245.9950527223213,
            "unit": "iter/sec",
            "range": "stddev: 0.0001239391047006211",
            "extra": "mean: 4.065122403615157 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 108.59723761362746,
            "unit": "iter/sec",
            "range": "stddev: 0.000302547532310817",
            "extra": "mean: 9.208337357142073 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.008781680242617,
            "unit": "iter/sec",
            "range": "stddev: 0.0009806361116544936",
            "extra": "mean: 35.70308810345006 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 164.69192284000206,
            "unit": "iter/sec",
            "range": "stddev: 0.0003077623073900553",
            "extra": "mean: 6.071943194029609 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 215.63725466518542,
            "unit": "iter/sec",
            "range": "stddev: 0.00014093574502303983",
            "extra": "mean: 4.63741759999994 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 73.46797197569813,
            "unit": "iter/sec",
            "range": "stddev: 0.000208278266736439",
            "extra": "mean: 13.611373406778968 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.114055551456726,
            "unit": "iter/sec",
            "range": "stddev: 0.002376975134551776",
            "extra": "mean: 109.72063911111087 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.147736777462367,
            "unit": "iter/sec",
            "range": "stddev: 0.03888474096033633",
            "extra": "mean: 52.225493363635486 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.91087465372766,
            "unit": "iter/sec",
            "range": "stddev: 0.0009515048227834286",
            "extra": "mean: 23.860155825000362 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 108.19709711498157,
            "unit": "iter/sec",
            "range": "stddev: 0.016111655292426905",
            "extra": "mean: 9.24239214049611 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 223.04676138796285,
            "unit": "iter/sec",
            "range": "stddev: 0.00013262122859374306",
            "extra": "mean: 4.483364805555823 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 215.81082484051615,
            "unit": "iter/sec",
            "range": "stddev: 0.00015016282220260685",
            "extra": "mean: 4.633687864077246 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 175.41527004251472,
            "unit": "iter/sec",
            "range": "stddev: 0.0001830572637365836",
            "extra": "mean: 5.700757977099906 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 97.02959462379015,
            "unit": "iter/sec",
            "range": "stddev: 0.0003184792920904834",
            "extra": "mean: 10.306133957142347 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 191.37677977688256,
            "unit": "iter/sec",
            "range": "stddev: 0.00037199731723917096",
            "extra": "mean: 5.225294318181413 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 231.21908032367452,
            "unit": "iter/sec",
            "range": "stddev: 0.00018013853942362945",
            "extra": "mean: 4.324902592814309 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 172.75054563506114,
            "unit": "iter/sec",
            "range": "stddev: 0.0009198155175903233",
            "extra": "mean: 5.788693727848011 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 150.04735940749865,
            "unit": "iter/sec",
            "range": "stddev: 0.00084642914694446",
            "extra": "mean: 6.664562468468372 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 212.27124929969148,
            "unit": "iter/sec",
            "range": "stddev: 0.0001655524034408595",
            "extra": "mean: 4.710953571428637 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "cdfb4c2ba59431279e03b6d28629230363ebd436",
          "message": "Merge pull request #104 from stnkvcmls/claude/p2-2-implementation-yqu3m0\n\nfeat(P2-2): add strength & mobility routine library with structured plan sessions",
          "timestamp": "2026-06-29T22:33:28+02:00",
          "tree_id": "f93639c337411659e1f84853de752aff7cc332db",
          "url": "https://github.com/stnkvcmls/running-coach/commit/cdfb4c2ba59431279e03b6d28629230363ebd436"
        },
        "date": 1782765261287,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 383.6804380268777,
            "unit": "iter/sec",
            "range": "stddev: 0.00013163152990934126",
            "extra": "mean: 2.6063356399993154 msec\nrounds: 50"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 90.43047365168616,
            "unit": "iter/sec",
            "range": "stddev: 0.0008338103546370894",
            "extra": "mean: 11.05821919999812 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 82.49639845031373,
            "unit": "iter/sec",
            "range": "stddev: 0.011283234431771276",
            "extra": "mean: 12.121741297619 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 72.91842946220339,
            "unit": "iter/sec",
            "range": "stddev: 0.016561430338229658",
            "extra": "mean: 13.713954172838308 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.63921049052334,
            "unit": "iter/sec",
            "range": "stddev: 0.00019432048478392331",
            "extra": "mean: 12.400915062499518 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 164.40211199666172,
            "unit": "iter/sec",
            "range": "stddev: 0.00010310364347852751",
            "extra": "mean: 6.082646918917353 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 181.95712780992224,
            "unit": "iter/sec",
            "range": "stddev: 0.00007531532080642569",
            "extra": "mean: 5.495800093330937 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.69356760582266,
            "unit": "iter/sec",
            "range": "stddev: 0.0001120952720025298",
            "extra": "mean: 5.084050343751034 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 142.1561337303337,
            "unit": "iter/sec",
            "range": "stddev: 0.00009099124459737031",
            "extra": "mean: 7.034518833334147 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 187.04659124489604,
            "unit": "iter/sec",
            "range": "stddev: 0.000189201710451648",
            "extra": "mean: 5.346261556248955 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 286.14852044085313,
            "unit": "iter/sec",
            "range": "stddev: 0.00009369740633009897",
            "extra": "mean: 3.4946886968325246 msec\nrounds: 221"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 124.24615594980148,
            "unit": "iter/sec",
            "range": "stddev: 0.011770019218846735",
            "extra": "mean: 8.048538744361835 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 217.71228629357805,
            "unit": "iter/sec",
            "range": "stddev: 0.00010610651239114617",
            "extra": "mean: 4.593218035713115 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.7575010470422,
            "unit": "iter/sec",
            "range": "stddev: 0.00012863152711429043",
            "extra": "mean: 3.8497444576928674 msec\nrounds: 260"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 272.6891247675281,
            "unit": "iter/sec",
            "range": "stddev: 0.00010743113717316516",
            "extra": "mean: 3.6671796165414228 msec\nrounds: 266"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 199.6239339776525,
            "unit": "iter/sec",
            "range": "stddev: 0.009395205698593288",
            "extra": "mean: 5.009419362068819 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 119.27535281754928,
            "unit": "iter/sec",
            "range": "stddev: 0.00014414329862032503",
            "extra": "mean: 8.383961785714941 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.15824444600794,
            "unit": "iter/sec",
            "range": "stddev: 0.00038951475797471526",
            "extra": "mean: 34.295617551725066 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 168.5369076349265,
            "unit": "iter/sec",
            "range": "stddev: 0.00014771589921926798",
            "extra": "mean: 5.9334184662159215 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 206.09379824378627,
            "unit": "iter/sec",
            "range": "stddev: 0.00012561793990988374",
            "extra": "mean: 4.852159591998543 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 77.04678720807223,
            "unit": "iter/sec",
            "range": "stddev: 0.0006219335314801772",
            "extra": "mean: 12.979126531251772 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.037402984924788,
            "unit": "iter/sec",
            "range": "stddev: 0.005465458531638782",
            "extra": "mean: 142.09787362499426 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.608379240600897,
            "unit": "iter/sec",
            "range": "stddev: 0.02685041467882556",
            "extra": "mean: 46.27834364000137 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.660224444880456,
            "unit": "iter/sec",
            "range": "stddev: 0.0013246126212060419",
            "extra": "mean: 30.61828315624915 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 111.3939616403933,
            "unit": "iter/sec",
            "range": "stddev: 0.011982090593672928",
            "extra": "mean: 8.97714728225792 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.26424670979182,
            "unit": "iter/sec",
            "range": "stddev: 0.00011781310460570133",
            "extra": "mean: 4.755920303370487 msec\nrounds: 178"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 209.0185271822952,
            "unit": "iter/sec",
            "range": "stddev: 0.00011763181461697096",
            "extra": "mean: 4.784264885417795 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 178.79796826585715,
            "unit": "iter/sec",
            "range": "stddev: 0.00012210992301197433",
            "extra": "mean: 5.592904716417618 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 106.28672034358777,
            "unit": "iter/sec",
            "range": "stddev: 0.00014232570956221463",
            "extra": "mean: 9.408513093332354 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 186.0882752060394,
            "unit": "iter/sec",
            "range": "stddev: 0.00014668007417055547",
            "extra": "mean: 5.373793694915956 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 228.06223084727358,
            "unit": "iter/sec",
            "range": "stddev: 0.00009861851008287348",
            "extra": "mean: 4.384768123528835 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 175.0389254226067,
            "unit": "iter/sec",
            "range": "stddev: 0.0008245611293461962",
            "extra": "mean: 5.713014962732669 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 154.36565923664156,
            "unit": "iter/sec",
            "range": "stddev: 0.0005475432478256995",
            "extra": "mean: 6.478124765217415 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 206.1097708249659,
            "unit": "iter/sec",
            "range": "stddev: 0.00009139128322143813",
            "extra": "mean: 4.851783571431107 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4540dd8ec996c5f79cf8c145aa5e0e0f9f0ba9ae",
          "message": "Merge pull request #95 from stnkvcmls/claude/activity-graphs-axis-info-w18ops\n\nAdd Y-axis labels to activity detail charts",
          "timestamp": "2026-06-30T03:01:57+02:00",
          "tree_id": "39b42bd86cda5a30265e797acd4559793f14bcc8",
          "url": "https://github.com/stnkvcmls/running-coach/commit/4540dd8ec996c5f79cf8c145aa5e0e0f9f0ba9ae"
        },
        "date": 1782781370470,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 412.31898566598244,
            "unit": "iter/sec",
            "range": "stddev: 0.0003897975281810796",
            "extra": "mean: 2.4253067037036584 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 87.15527517588706,
            "unit": "iter/sec",
            "range": "stddev: 0.0011067779896168912",
            "extra": "mean: 11.473774799998182 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 75.95162220728443,
            "unit": "iter/sec",
            "range": "stddev: 0.014800128422318499",
            "extra": "mean: 13.166275728395057 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 68.70687981359133,
            "unit": "iter/sec",
            "range": "stddev: 0.021375790167445487",
            "extra": "mean: 14.554583219513106 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 78.16287774492284,
            "unit": "iter/sec",
            "range": "stddev: 0.0005354204380697271",
            "extra": "mean: 12.793797117647147 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 171.39506485321027,
            "unit": "iter/sec",
            "range": "stddev: 0.00009972492520061973",
            "extra": "mean: 5.834473710526267 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 187.00848037003595,
            "unit": "iter/sec",
            "range": "stddev: 0.00026287005130692",
            "extra": "mean: 5.347351082802704 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 198.3840227571818,
            "unit": "iter/sec",
            "range": "stddev: 0.00022588555707528978",
            "extra": "mean: 5.040728512819707 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 139.0671867391324,
            "unit": "iter/sec",
            "range": "stddev: 0.0005356782531155386",
            "extra": "mean: 7.190768889830486 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 188.25170469386526,
            "unit": "iter/sec",
            "range": "stddev: 0.00014922554312594638",
            "extra": "mean: 5.312036890322981 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 252.6208529878374,
            "unit": "iter/sec",
            "range": "stddev: 0.00998629584947567",
            "extra": "mean: 3.958501399123 msec\nrounds: 228"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 152.44970213695902,
            "unit": "iter/sec",
            "range": "stddev: 0.0004526832542683581",
            "extra": "mean: 6.559540530302984 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 229.88711527043938,
            "unit": "iter/sec",
            "range": "stddev: 0.0002623944289191803",
            "extra": "mean: 4.349961061643665 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 277.615176945757,
            "unit": "iter/sec",
            "range": "stddev: 0.00020250670147467812",
            "extra": "mean: 3.602108541044891 msec\nrounds: 268"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 244.2470242733418,
            "unit": "iter/sec",
            "range": "stddev: 0.010417818818287315",
            "extra": "mean: 4.094215694029827 msec\nrounds: 268"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 242.93250642045555,
            "unit": "iter/sec",
            "range": "stddev: 0.00021433200403430397",
            "extra": "mean: 4.1163696647053465 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 102.88014631520265,
            "unit": "iter/sec",
            "range": "stddev: 0.0006236777196781193",
            "extra": "mean: 9.720048384614607 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 26.881724739106346,
            "unit": "iter/sec",
            "range": "stddev: 0.0025213392339069277",
            "extra": "mean: 37.199994037036035 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 153.32709741805937,
            "unit": "iter/sec",
            "range": "stddev: 0.000627689922665695",
            "extra": "mean: 6.52200437391321 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 207.9295563262595,
            "unit": "iter/sec",
            "range": "stddev: 0.0003446231264660162",
            "extra": "mean: 4.80932108771931 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 61.241860859916706,
            "unit": "iter/sec",
            "range": "stddev: 0.0010653530318997986",
            "extra": "mean: 16.328700433962613 msec\nrounds: 53"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.883936171248092,
            "unit": "iter/sec",
            "range": "stddev: 0.0030074658725928187",
            "extra": "mean: 112.56271777777884 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 18.528209383665654,
            "unit": "iter/sec",
            "range": "stddev: 0.042647336005105015",
            "extra": "mean: 53.97175621739213 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 38.53056194083244,
            "unit": "iter/sec",
            "range": "stddev: 0.0020212692838192776",
            "extra": "mean: 25.953423714286878 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 103.95028375979548,
            "unit": "iter/sec",
            "range": "stddev: 0.017646495771386706",
            "extra": "mean: 9.619983359648767 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 214.4457111534665,
            "unit": "iter/sec",
            "range": "stddev: 0.0006270387209421194",
            "extra": "mean: 4.66318489011122 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 206.47517763135411,
            "unit": "iter/sec",
            "range": "stddev: 0.0006546945271499383",
            "extra": "mean: 4.843197189472455 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 173.03107146920885,
            "unit": "iter/sec",
            "range": "stddev: 0.000658472993304507",
            "extra": "mean: 5.779308834586692 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 96.40392494449092,
            "unit": "iter/sec",
            "range": "stddev: 0.00042950892146447134",
            "extra": "mean: 10.373021643836564 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 189.97969975568805,
            "unit": "iter/sec",
            "range": "stddev: 0.0003932097437452818",
            "extra": "mean: 5.263720288462346 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 234.21299015052756,
            "unit": "iter/sec",
            "range": "stddev: 0.00018666400804874867",
            "extra": "mean: 4.269618006060658 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 166.39305270401485,
            "unit": "iter/sec",
            "range": "stddev: 0.001052880677854534",
            "extra": "mean: 6.0098663000001045 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 154.9516698207529,
            "unit": "iter/sec",
            "range": "stddev: 0.0005510516536289701",
            "extra": "mean: 6.453625192660355 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 211.03378911248737,
            "unit": "iter/sec",
            "range": "stddev: 0.0002458758897413917",
            "extra": "mean: 4.738577666664412 msec\nrounds: 6"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3e4a7a2a51cbd60cf2ce685ca1ee610cad28752d",
          "message": "Merge pull request #105 from stnkvcmls/claude/p3-1-implementation-qzvw5q\n\nP3-1: add startup security guard for auth_enabled=False on public bind",
          "timestamp": "2026-06-30T04:39:59+02:00",
          "tree_id": "07eb90e7714be41f1df46308acb53b785250cf9e",
          "url": "https://github.com/stnkvcmls/running-coach/commit/3e4a7a2a51cbd60cf2ce685ca1ee610cad28752d"
        },
        "date": 1782787250813,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 375.4110281495277,
            "unit": "iter/sec",
            "range": "stddev: 0.00016400817780051999",
            "extra": "mean: 2.663746999999414 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 83.04867293369533,
            "unit": "iter/sec",
            "range": "stddev: 0.0006642374580754834",
            "extra": "mean: 12.041131600000199 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 82.62235396406844,
            "unit": "iter/sec",
            "range": "stddev: 0.010562413049296525",
            "extra": "mean: 12.10326203529482 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.2311746672288,
            "unit": "iter/sec",
            "range": "stddev: 0.01538139982301837",
            "extra": "mean: 13.471429011906434 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.3591338084859,
            "unit": "iter/sec",
            "range": "stddev: 0.0004380203152125483",
            "extra": "mean: 12.444136125001393 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 164.69331574912732,
            "unit": "iter/sec",
            "range": "stddev: 0.0000692546252419726",
            "extra": "mean: 6.071891840002006 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.24032734960562,
            "unit": "iter/sec",
            "range": "stddev: 0.00017747162405016873",
            "extra": "mean: 5.548147935064145 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 191.51316114609213,
            "unit": "iter/sec",
            "range": "stddev: 0.0002584893352983542",
            "extra": "mean: 5.221573253846346 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 140.05014355342558,
            "unit": "iter/sec",
            "range": "stddev: 0.00014037163420583214",
            "extra": "mean: 7.140299714284301 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 184.88900101610994,
            "unit": "iter/sec",
            "range": "stddev: 0.0002194452490047748",
            "extra": "mean: 5.40865056603809 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 244.44461872018917,
            "unit": "iter/sec",
            "range": "stddev: 0.0075846840956137794",
            "extra": "mean: 4.0909061743129636 msec\nrounds: 218"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 149.59435373648262,
            "unit": "iter/sec",
            "range": "stddev: 0.00021627542350530297",
            "extra": "mean: 6.684744276923356 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 216.09558667479288,
            "unit": "iter/sec",
            "range": "stddev: 0.00019964729903140314",
            "extra": "mean: 4.627581781690537 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 229.0663373178679,
            "unit": "iter/sec",
            "range": "stddev: 0.007441169113183583",
            "extra": "mean: 4.365547603846883 msec\nrounds: 260"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 263.4357239982989,
            "unit": "iter/sec",
            "range": "stddev: 0.000312580538475132",
            "extra": "mean: 3.7959923765178383 msec\nrounds: 247"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 231.1787708890556,
            "unit": "iter/sec",
            "range": "stddev: 0.0002013381818352751",
            "extra": "mean: 4.325656703486444 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 116.5509374134093,
            "unit": "iter/sec",
            "range": "stddev: 0.00020238454962256928",
            "extra": "mean: 8.579939571425095 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.842404266656583,
            "unit": "iter/sec",
            "range": "stddev: 0.0005367711566430034",
            "extra": "mean: 34.671173413793916 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 166.8362560967375,
            "unit": "iter/sec",
            "range": "stddev: 0.00026853490117251884",
            "extra": "mean: 5.993900986486804 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 204.13692537853387,
            "unit": "iter/sec",
            "range": "stddev: 0.00012189743064574384",
            "extra": "mean: 4.898672781250557 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 69.44386831068134,
            "unit": "iter/sec",
            "range": "stddev: 0.0002676513978375663",
            "extra": "mean: 14.400119468088265 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.95135024541544,
            "unit": "iter/sec",
            "range": "stddev: 0.009822963816888968",
            "extra": "mean: 143.85694357143362 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.086999566524895,
            "unit": "iter/sec",
            "range": "stddev: 0.028501477015309636",
            "extra": "mean: 47.422583608693 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.302533407148154,
            "unit": "iter/sec",
            "range": "stddev: 0.001539488192738412",
            "extra": "mean: 30.957324225805532 msec\nrounds: 31"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 108.7418925201235,
            "unit": "iter/sec",
            "range": "stddev: 0.013291124575038532",
            "extra": "mean: 9.196087881355774 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.69294976311605,
            "unit": "iter/sec",
            "range": "stddev: 0.00014734666539128585",
            "extra": "mean: 4.746243294444873 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 209.7719016520922,
            "unit": "iter/sec",
            "range": "stddev: 0.00010295267612088447",
            "extra": "mean: 4.767082684212423 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.520347089556,
            "unit": "iter/sec",
            "range": "stddev: 0.00010873270279345531",
            "extra": "mean: 5.633157079709387 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 104.65925007234152,
            "unit": "iter/sec",
            "range": "stddev: 0.00017892118393096992",
            "extra": "mean: 9.554817173912388 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.0151427030026,
            "unit": "iter/sec",
            "range": "stddev: 0.00024079745701574052",
            "extra": "mean: 5.494048380533472 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.10929701148834,
            "unit": "iter/sec",
            "range": "stddev: 0.0001031808672391252",
            "extra": "mean: 4.40316628671267 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 178.3341508458285,
            "unit": "iter/sec",
            "range": "stddev: 0.00043735525745368945",
            "extra": "mean: 5.607450929937189 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 154.40134843334533,
            "unit": "iter/sec",
            "range": "stddev: 0.0003294502578334651",
            "extra": "mean: 6.476627374997942 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 204.90807431055572,
            "unit": "iter/sec",
            "range": "stddev: 0.00015047145449307667",
            "extra": "mean: 4.880237166664377 msec\nrounds: 12"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f86d4d1f95f1f6f09d7bfbb30d38ee1f862efc29",
          "message": "Merge pull request #106 from stnkvcmls/claude/p3-3-implementation-34zyzp\n\nP3-3: lift model catalog from code into Settings.available_models",
          "timestamp": "2026-06-30T05:21:10+02:00",
          "tree_id": "74c0fae36294d5b65a8fd96b51495972e5c86455",
          "url": "https://github.com/stnkvcmls/running-coach/commit/f86d4d1f95f1f6f09d7bfbb30d38ee1f862efc29"
        },
        "date": 1782789730706,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 360.13410198625087,
            "unit": "iter/sec",
            "range": "stddev: 0.0005539562761441979",
            "extra": "mean: 2.7767434255314645 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 86.68098474730155,
            "unit": "iter/sec",
            "range": "stddev: 0.0006920948155731262",
            "extra": "mean: 11.536555600000042 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 78.6778571993831,
            "unit": "iter/sec",
            "range": "stddev: 0.011372451949697803",
            "extra": "mean: 12.710056369047132 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 72.1545404664944,
            "unit": "iter/sec",
            "range": "stddev: 0.01636630762180823",
            "extra": "mean: 13.85914169135841 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 79.48102012541662,
            "unit": "iter/sec",
            "range": "stddev: 0.0004541347999848874",
            "extra": "mean: 12.581620095238533 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 163.2414067881427,
            "unit": "iter/sec",
            "range": "stddev: 0.00014465120619910923",
            "extra": "mean: 6.12589672972995 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.26909367517484,
            "unit": "iter/sec",
            "range": "stddev: 0.00020533998015635432",
            "extra": "mean: 5.578206368421441 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 192.34432471201615,
            "unit": "iter/sec",
            "range": "stddev: 0.00022661944940693572",
            "extra": "mean: 5.199009648437669 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 140.02527226378962,
            "unit": "iter/sec",
            "range": "stddev: 0.00015055131144937602",
            "extra": "mean: 7.1415679743591465 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 163.50142564204654,
            "unit": "iter/sec",
            "range": "stddev: 0.008676981517768523",
            "extra": "mean: 6.116154621118097 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 283.45821312003085,
            "unit": "iter/sec",
            "range": "stddev: 0.00013798522502606636",
            "extra": "mean: 3.5278568540772826 msec\nrounds: 233"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 130.06435623365962,
            "unit": "iter/sec",
            "range": "stddev: 0.011516540613309333",
            "extra": "mean: 7.688501515384489 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 216.29989546662745,
            "unit": "iter/sec",
            "range": "stddev: 0.00012331530739341712",
            "extra": "mean: 4.623210741006985 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 260.42996756373805,
            "unit": "iter/sec",
            "range": "stddev: 0.00012657753708037942",
            "extra": "mean: 3.8398038803090446 msec\nrounds: 259"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 271.81185139450423,
            "unit": "iter/sec",
            "range": "stddev: 0.00011030859626127159",
            "extra": "mean: 3.6790154471543364 msec\nrounds: 246"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 233.0815317409265,
            "unit": "iter/sec",
            "range": "stddev: 0.00010483594560545777",
            "extra": "mean: 4.290344209302325 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 115.88026360542982,
            "unit": "iter/sec",
            "range": "stddev: 0.00036598888112878195",
            "extra": "mean: 8.629597214284754 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.02040723742936,
            "unit": "iter/sec",
            "range": "stddev: 0.00039682423994396915",
            "extra": "mean: 34.45851024138076 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 159.89945487935438,
            "unit": "iter/sec",
            "range": "stddev: 0.0003502113211445602",
            "extra": "mean: 6.25393001342318 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 205.1461129676259,
            "unit": "iter/sec",
            "range": "stddev: 0.00013752057332556966",
            "extra": "mean: 4.874574446154922 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 70.12186024082128,
            "unit": "iter/sec",
            "range": "stddev: 0.00019784798161412705",
            "extra": "mean: 14.260888067796186 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.166783436562149,
            "unit": "iter/sec",
            "range": "stddev: 0.007090111006243544",
            "extra": "mean: 139.5326102500025 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.44453962633037,
            "unit": "iter/sec",
            "range": "stddev: 0.026407016606741166",
            "extra": "mean: 46.631917375002274 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 28.81498626518661,
            "unit": "iter/sec",
            "range": "stddev: 0.02358400446368097",
            "extra": "mean: 34.70416368749652 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.7633529578855,
            "unit": "iter/sec",
            "range": "stddev: 0.00026659530421383495",
            "extra": "mean: 7.888715284552542 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.86071301215443,
            "unit": "iter/sec",
            "range": "stddev: 0.000151250053266463",
            "extra": "mean: 4.742467127778127 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 208.8880166035063,
            "unit": "iter/sec",
            "range": "stddev: 0.00017625217345746674",
            "extra": "mean: 4.787254033332683 msec\nrounds: 90"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.3199362642363,
            "unit": "iter/sec",
            "range": "stddev: 0.0001195309946984618",
            "extra": "mean: 5.639523795620099 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 104.8354158484042,
            "unit": "iter/sec",
            "range": "stddev: 0.00019332782368826598",
            "extra": "mean: 9.538761227847239 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 180.52832901566066,
            "unit": "iter/sec",
            "range": "stddev: 0.0007188053377292847",
            "extra": "mean: 5.5392968264457325 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.25319859010398,
            "unit": "iter/sec",
            "range": "stddev: 0.00008455768864608892",
            "extra": "mean: 4.400378107784953 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 175.280728241679,
            "unit": "iter/sec",
            "range": "stddev: 0.0004300930016001695",
            "extra": "mean: 5.7051337590359 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 153.6713432475603,
            "unit": "iter/sec",
            "range": "stddev: 0.0003359925037973264",
            "extra": "mean: 6.507394149532666 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 203.5339719861297,
            "unit": "iter/sec",
            "range": "stddev: 0.0002945311740850099",
            "extra": "mean: 4.913184714285178 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d8999267863a8eeea4514c8cb78e87863ae6f079",
          "message": "Merge pull request #107 from stnkvcmls/claude/codebase-state-docs-l3h352\n\ndocs: refresh CURRENT_STATE.md to reflect v3 features",
          "timestamp": "2026-06-30T17:26:43+02:00",
          "tree_id": "5d0189d19f390e728842817e5dc2fc66e1d30e02",
          "url": "https://github.com/stnkvcmls/running-coach/commit/d8999267863a8eeea4514c8cb78e87863ae6f079"
        },
        "date": 1782833265345,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 406.99881927348207,
            "unit": "iter/sec",
            "range": "stddev: 0.00029709523726884616",
            "extra": "mean: 2.4570095849050904 msec\nrounds: 53"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 81.44525053162427,
            "unit": "iter/sec",
            "range": "stddev: 0.0010327157619610162",
            "extra": "mean: 12.278186799998991 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 72.30614536915887,
            "unit": "iter/sec",
            "range": "stddev: 0.015919410345210147",
            "extra": "mean: 13.830083112500358 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 65.27712063384189,
            "unit": "iter/sec",
            "range": "stddev: 0.022230850705346486",
            "extra": "mean: 15.319303153846 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 74.28759426685815,
            "unit": "iter/sec",
            "range": "stddev: 0.0005547791045304811",
            "extra": "mean: 13.46119779310351 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 151.89091890875864,
            "unit": "iter/sec",
            "range": "stddev: 0.0008465907148920533",
            "extra": "mean: 6.5836720666671535 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 184.11548275424917,
            "unit": "iter/sec",
            "range": "stddev: 0.00014340572257623134",
            "extra": "mean: 5.431373749999964 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 183.07077796985922,
            "unit": "iter/sec",
            "range": "stddev: 0.00030110671206066546",
            "extra": "mean: 5.462368222221899 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 128.22617670516024,
            "unit": "iter/sec",
            "range": "stddev: 0.0006167856687567312",
            "extra": "mean: 7.79871961946875 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 172.28808600246472,
            "unit": "iter/sec",
            "range": "stddev: 0.0003499229240076244",
            "extra": "mean: 5.804231872340227 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 298.30117318420184,
            "unit": "iter/sec",
            "range": "stddev: 0.00018997227530892575",
            "extra": "mean: 3.3523166849313637 msec\nrounds: 219"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 126.40877694855011,
            "unit": "iter/sec",
            "range": "stddev: 0.013234382611570448",
            "extra": "mean: 7.910843092857484 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 233.48110709309645,
            "unit": "iter/sec",
            "range": "stddev: 0.00015750452414154865",
            "extra": "mean: 4.283001791666457 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 234.48789811539862,
            "unit": "iter/sec",
            "range": "stddev: 0.010239441578248527",
            "extra": "mean: 4.264612408730235 msec\nrounds: 252"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 287.3924939588221,
            "unit": "iter/sec",
            "range": "stddev: 0.00012107534161169125",
            "extra": "mean: 3.479561996296538 msec\nrounds: 270"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 240.46980148917785,
            "unit": "iter/sec",
            "range": "stddev: 0.00021318178556498974",
            "extra": "mean: 4.158526325581069 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 106.89279889173581,
            "unit": "iter/sec",
            "range": "stddev: 0.0004362724256574851",
            "extra": "mean: 9.355167142857113 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.094261726473285,
            "unit": "iter/sec",
            "range": "stddev: 0.00042696954678885825",
            "extra": "mean: 35.59445732142866 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 159.51770083209257,
            "unit": "iter/sec",
            "range": "stddev: 0.0002257150775473777",
            "extra": "mean: 6.2688967731085485 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 212.91902300266756,
            "unit": "iter/sec",
            "range": "stddev: 0.00011383977144944238",
            "extra": "mean: 4.696621212598141 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 62.78958943816286,
            "unit": "iter/sec",
            "range": "stddev: 0.0004632252091113882",
            "extra": "mean: 15.926207018519069 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.629056818883073,
            "unit": "iter/sec",
            "range": "stddev: 0.0591307223484905",
            "extra": "mean: 131.07780211111398 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 18.733910111492513,
            "unit": "iter/sec",
            "range": "stddev: 0.04247222950445632",
            "extra": "mean: 53.37913943478033 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 40.90169278751809,
            "unit": "iter/sec",
            "range": "stddev: 0.0007409531665003243",
            "extra": "mean: 24.44886585000141 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 129.00657296933414,
            "unit": "iter/sec",
            "range": "stddev: 0.00015661240982375998",
            "extra": "mean: 7.751543018181776 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 223.3389200950757,
            "unit": "iter/sec",
            "range": "stddev: 0.00035203390992847444",
            "extra": "mean: 4.477499934065673 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 211.25228122658217,
            "unit": "iter/sec",
            "range": "stddev: 0.0007287712559352954",
            "extra": "mean: 4.733676693069332 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 172.740395643814,
            "unit": "iter/sec",
            "range": "stddev: 0.0009681374838447504",
            "extra": "mean: 5.789033863636464 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 96.095327155898,
            "unit": "iter/sec",
            "range": "stddev: 0.0002944738963575271",
            "extra": "mean: 10.40633326923039 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 192.13548629892043,
            "unit": "iter/sec",
            "range": "stddev: 0.0002332562829137969",
            "extra": "mean: 5.204660623931909 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 232.6659578912358,
            "unit": "iter/sec",
            "range": "stddev: 0.0002574926822793289",
            "extra": "mean: 4.29800736241556 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 178.0650703364597,
            "unit": "iter/sec",
            "range": "stddev: 0.000449667021293267",
            "extra": "mean: 5.6159245499999955 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 148.9405935777677,
            "unit": "iter/sec",
            "range": "stddev: 0.0003726374532368362",
            "extra": "mean: 6.7140863076919395 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.79306887103985,
            "unit": "iter/sec",
            "range": "stddev: 0.0003913180824943121",
            "extra": "mean: 4.743988999997839 msec\nrounds: 8"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "52d9ae95ba14d41e7ce13548f10609a3e74eb004",
          "message": "Merge pull request #108 from stnkvcmls/claude/p0-1-implementation-yxxfbs\n\nfeat: P0-1 weather-adjusted pace and heat-aware coaching",
          "timestamp": "2026-06-30T22:31:39+02:00",
          "tree_id": "0bdb7e3078ee013bcfcab2315f801bb3d5b3aa0b",
          "url": "https://github.com/stnkvcmls/running-coach/commit/52d9ae95ba14d41e7ce13548f10609a3e74eb004"
        },
        "date": 1782851554847,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 415.7467311301124,
            "unit": "iter/sec",
            "range": "stddev: 0.00014420443607847353",
            "extra": "mean: 2.4053105535712302 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 88.82215147715557,
            "unit": "iter/sec",
            "range": "stddev: 0.0006619612169825816",
            "extra": "mean: 11.25845279999993 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 79.85485336716206,
            "unit": "iter/sec",
            "range": "stddev: 0.01276236459356516",
            "extra": "mean: 12.522720383720852 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 70.45006464493457,
            "unit": "iter/sec",
            "range": "stddev: 0.019900922885345142",
            "extra": "mean: 14.194451134146703 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 75.98659552450395,
            "unit": "iter/sec",
            "range": "stddev: 0.000402129404580665",
            "extra": "mean: 13.16021586567229 msec\nrounds: 67"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 166.33274059889408,
            "unit": "iter/sec",
            "range": "stddev: 0.0001793256952614986",
            "extra": "mean: 6.012045472222856 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.45434052221097,
            "unit": "iter/sec",
            "range": "stddev: 0.00022885022680645237",
            "extra": "mean: 5.480823296052338 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 190.82915866752055,
            "unit": "iter/sec",
            "range": "stddev: 0.00019427313060177564",
            "extra": "mean: 5.240289308943025 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.2749462609084,
            "unit": "iter/sec",
            "range": "stddev: 0.0001955622645516446",
            "extra": "mean: 7.284650456896728 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 181.00943800435536,
            "unit": "iter/sec",
            "range": "stddev: 0.0002656931754158913",
            "extra": "mean: 5.524573806896955 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 301.5196451050503,
            "unit": "iter/sec",
            "range": "stddev: 0.00013495218788414434",
            "extra": "mean: 3.316533487068802 msec\nrounds: 232"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 130.62008179821302,
            "unit": "iter/sec",
            "range": "stddev: 0.012219869829350232",
            "extra": "mean: 7.65579064285719 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 230.27433096267626,
            "unit": "iter/sec",
            "range": "stddev: 0.00014165582495987488",
            "extra": "mean: 4.342646424460066 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 273.8653233543873,
            "unit": "iter/sec",
            "range": "stddev: 0.0001433681212719421",
            "extra": "mean: 3.6514297894734917 msec\nrounds: 266"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 275.545988992959,
            "unit": "iter/sec",
            "range": "stddev: 0.0001440696222546897",
            "extra": "mean: 3.629158252873544 msec\nrounds: 261"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 230.3952383561323,
            "unit": "iter/sec",
            "range": "stddev: 0.00015014300569697977",
            "extra": "mean: 4.340367479532086 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 105.25872594837783,
            "unit": "iter/sec",
            "range": "stddev: 0.0004318563681334273",
            "extra": "mean: 9.500400000000297 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.53168905276178,
            "unit": "iter/sec",
            "range": "stddev: 0.0006561042681010258",
            "extra": "mean: 36.321781714285606 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 159.13943874621765,
            "unit": "iter/sec",
            "range": "stddev: 0.0002642716928498834",
            "extra": "mean: 6.283797453846227 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 205.95430600259556,
            "unit": "iter/sec",
            "range": "stddev: 0.00016383958290550608",
            "extra": "mean: 4.855445945312731 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 52.65604642334676,
            "unit": "iter/sec",
            "range": "stddev: 0.023715343871300747",
            "extra": "mean: 18.991171345454788 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.287926319623546,
            "unit": "iter/sec",
            "range": "stddev: 0.0007296338183356919",
            "extra": "mean: 107.66665944444436 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.308209886739697,
            "unit": "iter/sec",
            "range": "stddev: 0.034619617097364476",
            "extra": "mean: 51.79144031818146 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 40.16818442921059,
            "unit": "iter/sec",
            "range": "stddev: 0.0012508600286122097",
            "extra": "mean: 24.895324850002254 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 101.68637399276375,
            "unit": "iter/sec",
            "range": "stddev: 0.016424557026842757",
            "extra": "mean: 9.834159295238145 msec\nrounds: 105"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 215.172355379559,
            "unit": "iter/sec",
            "range": "stddev: 0.00031830891848290155",
            "extra": "mean: 4.6474371590905506 msec\nrounds: 176"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 212.66567122351017,
            "unit": "iter/sec",
            "range": "stddev: 0.00019171954102238954",
            "extra": "mean: 4.70221636734688 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 182.13407564957478,
            "unit": "iter/sec",
            "range": "stddev: 0.00012545613173021007",
            "extra": "mean: 5.490460785185503 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 92.96172869746937,
            "unit": "iter/sec",
            "range": "stddev: 0.000761703380265624",
            "extra": "mean: 10.757114933333014 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 192.41996132177366,
            "unit": "iter/sec",
            "range": "stddev: 0.0001976809320901562",
            "extra": "mean: 5.196966017095042 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 230.61796290504282,
            "unit": "iter/sec",
            "range": "stddev: 0.00018033379347123476",
            "extra": "mean: 4.336175670807356 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 177.6092301705203,
            "unit": "iter/sec",
            "range": "stddev: 0.0003884895759805048",
            "extra": "mean: 5.630338012500324 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 155.16515675613428,
            "unit": "iter/sec",
            "range": "stddev: 0.00026220307866266224",
            "extra": "mean: 6.444745849557272 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 209.8693898837969,
            "unit": "iter/sec",
            "range": "stddev: 0.00011810982706593931",
            "extra": "mean: 4.764868285716618 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "31c577f1d0ece7a10f6269839166d5d583f7db67",
          "message": "Merge pull request #109 from stnkvcmls/claude/item-p0-2-dzy3od\n\nfeat: P0-2 chat tool-use — let the coach act on the conversation",
          "timestamp": "2026-06-30T23:44:04+02:00",
          "tree_id": "b5ac3613a2b5fba894f80c45519280a96d5d48bd",
          "url": "https://github.com/stnkvcmls/running-coach/commit/31c577f1d0ece7a10f6269839166d5d583f7db67"
        },
        "date": 1782855898223,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 416.6790944363162,
            "unit": "iter/sec",
            "range": "stddev: 0.00016654023056919523",
            "extra": "mean: 2.3999284181818643 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 83.81362872965228,
            "unit": "iter/sec",
            "range": "stddev: 0.0010280357209330273",
            "extra": "mean: 11.93123380000145 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 73.42714954052971,
            "unit": "iter/sec",
            "range": "stddev: 0.01694121040426207",
            "extra": "mean: 13.61894076315775 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 76.86793639636336,
            "unit": "iter/sec",
            "range": "stddev: 0.015602361807081378",
            "extra": "mean: 13.009325433735855 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 71.45645362335195,
            "unit": "iter/sec",
            "range": "stddev: 0.0008268727829753671",
            "extra": "mean: 13.994537222222293 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 154.18668238228338,
            "unit": "iter/sec",
            "range": "stddev: 0.0007659033837043775",
            "extra": "mean: 6.485644444444599 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 183.11666020602803,
            "unit": "iter/sec",
            "range": "stddev: 0.0001335203038247384",
            "extra": "mean: 5.460999555555901 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 182.26370847668423,
            "unit": "iter/sec",
            "range": "stddev: 0.0003030309019405547",
            "extra": "mean: 5.486555762294957 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 134.35047373852217,
            "unit": "iter/sec",
            "range": "stddev: 0.00026161945430479787",
            "extra": "mean: 7.443219009009501 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 181.7071381924919,
            "unit": "iter/sec",
            "range": "stddev: 0.0002138794192469485",
            "extra": "mean: 5.503361122448848 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 302.19182008657776,
            "unit": "iter/sec",
            "range": "stddev: 0.00012710175636672694",
            "extra": "mean: 3.3091564149999186 msec\nrounds: 200"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 126.39206885151415,
            "unit": "iter/sec",
            "range": "stddev: 0.013704920969085715",
            "extra": "mean: 7.91188884782639 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 216.6594097990613,
            "unit": "iter/sec",
            "range": "stddev: 0.0011895728452414195",
            "extra": "mean: 4.61553920472432 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 274.7362343269308,
            "unit": "iter/sec",
            "range": "stddev: 0.00018778494582162765",
            "extra": "mean: 3.6398547954545353 msec\nrounds: 264"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 273.1636872931789,
            "unit": "iter/sec",
            "range": "stddev: 0.0008794402964459004",
            "extra": "mean: 3.6608086891385683 msec\nrounds: 267"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 244.71382202091866,
            "unit": "iter/sec",
            "range": "stddev: 0.0001330616476004474",
            "extra": "mean: 4.086405875000056 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 111.86000496657982,
            "unit": "iter/sec",
            "range": "stddev: 0.0001932319735679288",
            "extra": "mean: 8.939745714286065 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.72201295719088,
            "unit": "iter/sec",
            "range": "stddev: 0.0006445436235442349",
            "extra": "mean: 36.072416586206366 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 157.01862269594614,
            "unit": "iter/sec",
            "range": "stddev: 0.000581328241001271",
            "extra": "mean: 6.368671325925582 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 157.9033578843003,
            "unit": "iter/sec",
            "range": "stddev: 0.01689380178091713",
            "extra": "mean: 6.3329875526315575 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 62.38570311000574,
            "unit": "iter/sec",
            "range": "stddev: 0.0008337323828413404",
            "extra": "mean: 16.029313611111885 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.954238878681743,
            "unit": "iter/sec",
            "range": "stddev: 0.004807649775706891",
            "extra": "mean: 111.67895044444265 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 18.4162878069272,
            "unit": "iter/sec",
            "range": "stddev: 0.04121649808494273",
            "extra": "mean: 54.29975956521784 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 39.55826081315215,
            "unit": "iter/sec",
            "range": "stddev: 0.0013291952766747962",
            "extra": "mean: 25.27916999999971 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 119.1367762202588,
            "unit": "iter/sec",
            "range": "stddev: 0.000729905158701969",
            "extra": "mean: 8.39371377777766 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 221.0880675079179,
            "unit": "iter/sec",
            "range": "stddev: 0.00022255207429872713",
            "extra": "mean: 4.52308444897953 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 218.60487368950123,
            "unit": "iter/sec",
            "range": "stddev: 0.00017651667665474798",
            "extra": "mean: 4.574463428570972 msec\nrounds: 105"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 179.6190012752012,
            "unit": "iter/sec",
            "range": "stddev: 0.00025720803055585237",
            "extra": "mean: 5.567339718518206 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 94.5759190883046,
            "unit": "iter/sec",
            "range": "stddev: 0.0006795074530497657",
            "extra": "mean: 10.573516066667139 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 195.3621190539785,
            "unit": "iter/sec",
            "range": "stddev: 0.0001963427074888918",
            "extra": "mean: 5.118699596638283 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 180.17581115222265,
            "unit": "iter/sec",
            "range": "stddev: 0.015885765946860482",
            "extra": "mean: 5.550134580246978 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 177.9726224245408,
            "unit": "iter/sec",
            "range": "stddev: 0.0004621685173686382",
            "extra": "mean: 5.6188417430551345 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 157.94895813723502,
            "unit": "iter/sec",
            "range": "stddev: 0.0002421905657076543",
            "extra": "mean: 6.331159203539306 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 208.51362314817547,
            "unit": "iter/sec",
            "range": "stddev: 0.00024107902944564403",
            "extra": "mean: 4.795849714286403 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d358d10e9763f1130609941a692cfa1906708387",
          "message": "Merge pull request #110 from stnkvcmls/claude/p2-3-implementation-haj81t\n\nfeat: P2-3 explicit Running Stress Balance guidance",
          "timestamp": "2026-07-01T03:00:33+02:00",
          "tree_id": "c67d52712911b5e8389624c58d8c7bba426fa511",
          "url": "https://github.com/stnkvcmls/running-coach/commit/d358d10e9763f1130609941a692cfa1906708387"
        },
        "date": 1782867685680,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 420.4441545497406,
            "unit": "iter/sec",
            "range": "stddev: 0.00013895529401054913",
            "extra": "mean: 2.378437157892976 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 90.68328129469431,
            "unit": "iter/sec",
            "range": "stddev: 0.0008411300095421562",
            "extra": "mean: 11.027391000004627 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 68.27992401810359,
            "unit": "iter/sec",
            "range": "stddev: 0.012333854807895088",
            "extra": "mean: 14.645593333332682 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 82.80644541951276,
            "unit": "iter/sec",
            "range": "stddev: 0.011580286907319522",
            "extra": "mean: 12.07635462352979 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.66820795570456,
            "unit": "iter/sec",
            "range": "stddev: 0.00029973427169012435",
            "extra": "mean: 12.396457357142562 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 171.1338758853374,
            "unit": "iter/sec",
            "range": "stddev: 0.00016312612754106116",
            "extra": "mean: 5.843378435897852 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 165.0293097433154,
            "unit": "iter/sec",
            "range": "stddev: 0.008796747002493855",
            "extra": "mean: 6.059529677215447 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 200.58553707667437,
            "unit": "iter/sec",
            "range": "stddev: 0.00012764724253225062",
            "extra": "mean: 4.985404304686969 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 144.03476874565996,
            "unit": "iter/sec",
            "range": "stddev: 0.00012354483549192085",
            "extra": "mean: 6.942768115702841 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 189.15947433021816,
            "unit": "iter/sec",
            "range": "stddev: 0.0001630303521421654",
            "extra": "mean: 5.286544612903115 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 303.8867978489401,
            "unit": "iter/sec",
            "range": "stddev: 0.00012766435928770255",
            "extra": "mean: 3.2906990599081327 msec\nrounds: 217"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 134.17914665163988,
            "unit": "iter/sec",
            "range": "stddev: 0.01142258674831468",
            "extra": "mean: 7.452722907801995 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 234.58243987774057,
            "unit": "iter/sec",
            "range": "stddev: 0.00013264957708449557",
            "extra": "mean: 4.262893678321271 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 274.0228115395077,
            "unit": "iter/sec",
            "range": "stddev: 0.00021334501914525514",
            "extra": "mean: 3.649331215827713 msec\nrounds: 278"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 274.7251677315534,
            "unit": "iter/sec",
            "range": "stddev: 0.0003273435398460113",
            "extra": "mean: 3.6400014176245614 msec\nrounds: 261"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 242.25871082385305,
            "unit": "iter/sec",
            "range": "stddev: 0.00015751747829765618",
            "extra": "mean: 4.127818548192898 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 109.9497312970253,
            "unit": "iter/sec",
            "range": "stddev: 0.0003473149925664179",
            "extra": "mean: 9.095065428568764 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.208706004172843,
            "unit": "iter/sec",
            "range": "stddev: 0.0008352499188835539",
            "extra": "mean: 35.45004864285772 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.35345237588416,
            "unit": "iter/sec",
            "range": "stddev: 0.00014864533378853995",
            "extra": "mean: 5.975377178081455 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 214.78792368993984,
            "unit": "iter/sec",
            "range": "stddev: 0.00013538021992259738",
            "extra": "mean: 4.655755234375114 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 60.83145924182841,
            "unit": "iter/sec",
            "range": "stddev: 0.00020301323868090326",
            "extra": "mean: 16.438862596154664 msec\nrounds: 52"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 9.020865872573868,
            "unit": "iter/sec",
            "range": "stddev: 0.004607922351365032",
            "extra": "mean: 110.85410359999912 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.738384028219254,
            "unit": "iter/sec",
            "range": "stddev: 0.03215958705119443",
            "extra": "mean: 48.219764791667195 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 42.26667258125221,
            "unit": "iter/sec",
            "range": "stddev: 0.0009649543715485053",
            "extra": "mean: 23.659302682926587 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 130.97567073891614,
            "unit": "iter/sec",
            "range": "stddev: 0.00009452898037457121",
            "extra": "mean: 7.6350057560947855 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 224.13789977500315,
            "unit": "iter/sec",
            "range": "stddev: 0.00013805614429381272",
            "extra": "mean: 4.461539083768663 msec\nrounds: 191"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 220.69017468207971,
            "unit": "iter/sec",
            "range": "stddev: 0.0001357310167789474",
            "extra": "mean: 4.531239333334947 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 153.9192914201612,
            "unit": "iter/sec",
            "range": "stddev: 0.012657313223227575",
            "extra": "mean: 6.4969114057980555 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 102.08262002504266,
            "unit": "iter/sec",
            "range": "stddev: 0.0001864265631265849",
            "extra": "mean: 9.795986816900687 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 197.2713550262955,
            "unit": "iter/sec",
            "range": "stddev: 0.00015402961871646958",
            "extra": "mean: 5.0691596854835 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 236.58168812830934,
            "unit": "iter/sec",
            "range": "stddev: 0.0001306577581644709",
            "extra": "mean: 4.22686983050714 msec\nrounds: 177"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 188.1021789682692,
            "unit": "iter/sec",
            "range": "stddev: 0.00022306954525097285",
            "extra": "mean: 5.316259521739455 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 160.1178233865985,
            "unit": "iter/sec",
            "range": "stddev: 0.00015757394261147056",
            "extra": "mean: 6.245400910712716 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 213.6800808325703,
            "unit": "iter/sec",
            "range": "stddev: 0.00011627325043779466",
            "extra": "mean: 4.6798934000008785 msec\nrounds: 10"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5f4e7d188d2481405864f9ad0335a447225b79ea",
          "message": "Merge pull request #111 from stnkvcmls/claude/p1-3-implementation-eri8ai\n\nfeat: P1-3 persistent athlete memory for the coach",
          "timestamp": "2026-07-01T04:10:15+02:00",
          "tree_id": "098f50194e44766b9e6c8d683c13921937473904",
          "url": "https://github.com/stnkvcmls/running-coach/commit/5f4e7d188d2481405864f9ad0335a447225b79ea"
        },
        "date": 1782871871162,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 407.9188375741348,
            "unit": "iter/sec",
            "range": "stddev: 0.00028144033496731104",
            "extra": "mean: 2.4514680566039337 msec\nrounds: 53"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 82.33378743161161,
            "unit": "iter/sec",
            "range": "stddev: 0.000886296006887717",
            "extra": "mean: 12.14568200000059 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 59.20644059466708,
            "unit": "iter/sec",
            "range": "stddev: 0.017882009916189424",
            "extra": "mean: 16.890054358209017 msec\nrounds: 67"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 82.00743286563524,
            "unit": "iter/sec",
            "range": "stddev: 0.0004580461390159534",
            "extra": "mean: 12.194016628205473 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 70.08645569002034,
            "unit": "iter/sec",
            "range": "stddev: 0.0004957912780308944",
            "extra": "mean: 14.268092032258249 msec\nrounds: 62"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 111.76210811363977,
            "unit": "iter/sec",
            "range": "stddev: 0.018341308999360734",
            "extra": "mean: 8.947576391304283 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 175.25550611405043,
            "unit": "iter/sec",
            "range": "stddev: 0.0003151447088297031",
            "extra": "mean: 5.705954820895803 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 187.37705170433154,
            "unit": "iter/sec",
            "range": "stddev: 0.000349790708234894",
            "extra": "mean: 5.336832823999885 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 123.05817794358067,
            "unit": "iter/sec",
            "range": "stddev: 0.0005934519932469478",
            "extra": "mean: 8.126237660194162 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 172.237644623883,
            "unit": "iter/sec",
            "range": "stddev: 0.000308330057445744",
            "extra": "mean: 5.805931695035134 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 302.43984656396293,
            "unit": "iter/sec",
            "range": "stddev: 0.0001269514308739645",
            "extra": "mean: 3.3064426244129517 msec\nrounds: 213"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 121.54095158424332,
            "unit": "iter/sec",
            "range": "stddev: 0.014589097400112692",
            "extra": "mean: 8.227679534883952 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 223.76074396735245,
            "unit": "iter/sec",
            "range": "stddev: 0.00025942749578957856",
            "extra": "mean: 4.4690591489359 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 274.721018418315,
            "unit": "iter/sec",
            "range": "stddev: 0.00020014064384672555",
            "extra": "mean: 3.640056395238423 msec\nrounds: 210"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 278.26409405580296,
            "unit": "iter/sec",
            "range": "stddev: 0.0004895014581344379",
            "extra": "mean: 3.5937083560607013 msec\nrounds: 264"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 228.22555990821093,
            "unit": "iter/sec",
            "range": "stddev: 0.00020361541368765968",
            "extra": "mean: 4.381630174999618 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 100.11149185821473,
            "unit": "iter/sec",
            "range": "stddev: 0.0004901392358746348",
            "extra": "mean: 9.988863230769486 msec\nrounds: 13"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.225770791373826,
            "unit": "iter/sec",
            "range": "stddev: 0.0010398463654963694",
            "extra": "mean: 36.72990592857112 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 155.24007169883586,
            "unit": "iter/sec",
            "range": "stddev: 0.0004970519884377396",
            "extra": "mean: 6.441635777777723 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 208.57819724174124,
            "unit": "iter/sec",
            "range": "stddev: 0.00018557002595004506",
            "extra": "mean: 4.7943649586778445 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 52.92068575616683,
            "unit": "iter/sec",
            "range": "stddev: 0.001147422695855329",
            "extra": "mean: 18.896202604167318 msec\nrounds: 48"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.6144262988341,
            "unit": "iter/sec",
            "range": "stddev: 0.06632574383574391",
            "extra": "mean: 131.32965777777864 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 18.34766806059471,
            "unit": "iter/sec",
            "range": "stddev: 0.04104997804703219",
            "extra": "mean: 54.502839090908786 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 40.77396616591961,
            "unit": "iter/sec",
            "range": "stddev: 0.0010522224265568638",
            "extra": "mean: 24.52545322500015 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.94691484950012,
            "unit": "iter/sec",
            "range": "stddev: 0.00025399879599495925",
            "extra": "mean: 7.877308410255846 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 222.84612245443793,
            "unit": "iter/sec",
            "range": "stddev: 0.00017308850866581605",
            "extra": "mean: 4.487401391533996 msec\nrounds: 189"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 157.90325304785097,
            "unit": "iter/sec",
            "range": "stddev: 0.017585404578376707",
            "extra": "mean: 6.332991757281658 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 179.80602097492502,
            "unit": "iter/sec",
            "range": "stddev: 0.0003083630380446811",
            "extra": "mean: 5.561549021428241 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 87.10078557591596,
            "unit": "iter/sec",
            "range": "stddev: 0.000704192717545899",
            "extra": "mean: 11.480952707693003 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 193.27328300217667,
            "unit": "iter/sec",
            "range": "stddev: 0.0002580447399525981",
            "extra": "mean: 5.174020870689809 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 225.55639658167064,
            "unit": "iter/sec",
            "range": "stddev: 0.0003101690112779317",
            "extra": "mean: 4.433481005881892 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 175.8282153647156,
            "unit": "iter/sec",
            "range": "stddev: 0.0005078754754869915",
            "extra": "mean: 5.6873693333332636 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 150.22437980283115,
            "unit": "iter/sec",
            "range": "stddev: 0.0003655832309745169",
            "extra": "mean: 6.65670912612517 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 203.10596606951077,
            "unit": "iter/sec",
            "range": "stddev: 0.00030887826602246264",
            "extra": "mean: 4.923538285713188 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "61b19f1f7d0b76ed200ea8f18628149370612767",
          "message": "Merge pull request #112 from stnkvcmls/claude/p1-1-implementation-0pt65f\n\nfeat: P1-1 daily readiness-driven workout adaptation",
          "timestamp": "2026-07-01T05:59:32+02:00",
          "tree_id": "898502600b00c725115a1c347d088a97751e2c8f",
          "url": "https://github.com/stnkvcmls/running-coach/commit/61b19f1f7d0b76ed200ea8f18628149370612767"
        },
        "date": 1782878425404,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 394.29410963624355,
            "unit": "iter/sec",
            "range": "stddev: 0.0001488198035691664",
            "extra": "mean: 2.536177882349171 msec\nrounds: 51"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 92.00863762372002,
            "unit": "iter/sec",
            "range": "stddev: 0.000537421523913414",
            "extra": "mean: 10.868544799996016 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 70.683330516774,
            "unit": "iter/sec",
            "range": "stddev: 0.011170320789548153",
            "extra": "mean: 14.147607260281658 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 84.5783045864241,
            "unit": "iter/sec",
            "range": "stddev: 0.01018778336974113",
            "extra": "mean: 11.823363034880613 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 83.24804470611608,
            "unit": "iter/sec",
            "range": "stddev: 0.00008718554560021701",
            "extra": "mean: 12.01229414492821 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 168.401692537696,
            "unit": "iter/sec",
            "range": "stddev: 0.00007585237436133928",
            "extra": "mean: 5.938182597399694 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 185.6916598487085,
            "unit": "iter/sec",
            "range": "stddev: 0.00010327364137748342",
            "extra": "mean: 5.385271480769496 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 203.90930816992017,
            "unit": "iter/sec",
            "range": "stddev: 0.00010484905335744266",
            "extra": "mean: 4.904141007465375 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 145.06930485398664,
            "unit": "iter/sec",
            "range": "stddev: 0.0001234808092328497",
            "extra": "mean: 6.8932569919357345 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 193.9170641532891,
            "unit": "iter/sec",
            "range": "stddev: 0.00016400179697457695",
            "extra": "mean: 5.156843748467191 msec\nrounds: 163"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 259.37077220635507,
            "unit": "iter/sec",
            "range": "stddev: 0.006878838182572559",
            "extra": "mean: 3.8554845308645693 msec\nrounds: 243"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 154.40031904464115,
            "unit": "iter/sec",
            "range": "stddev: 0.00008037919602791658",
            "extra": "mean: 6.476670554747195 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 224.15507860267556,
            "unit": "iter/sec",
            "range": "stddev: 0.00011597712830772168",
            "extra": "mean: 4.461197159724151 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 267.02239644622864,
            "unit": "iter/sec",
            "range": "stddev: 0.00014263657778816762",
            "extra": "mean: 3.7450042142864746 msec\nrounds: 266"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 241.78561277016055,
            "unit": "iter/sec",
            "range": "stddev: 0.008201645116390512",
            "extra": "mean: 4.1358953849358775 msec\nrounds: 239"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 238.67463109457947,
            "unit": "iter/sec",
            "range": "stddev: 0.00010163867012718457",
            "extra": "mean: 4.1898043181796325 msec\nrounds: 176"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 123.4956887242041,
            "unit": "iter/sec",
            "range": "stddev: 0.00018391275002094154",
            "extra": "mean: 8.09744866667567 msec\nrounds: 15"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.362509441730857,
            "unit": "iter/sec",
            "range": "stddev: 0.00036588760134164723",
            "extra": "mean: 34.057034600004954 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 173.99417679199672,
            "unit": "iter/sec",
            "range": "stddev: 0.00010851217013225137",
            "extra": "mean: 5.747318780647821 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 211.25903564580497,
            "unit": "iter/sec",
            "range": "stddev: 0.00010813165484109648",
            "extra": "mean: 4.733525346942278 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 66.2540600153989,
            "unit": "iter/sec",
            "range": "stddev: 0.0002763436198501913",
            "extra": "mean: 15.093414649118529 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.662360965989169,
            "unit": "iter/sec",
            "range": "stddev: 0.04379932841343231",
            "extra": "mean: 150.09694087500236 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.21590723704278,
            "unit": "iter/sec",
            "range": "stddev: 0.02638735153098809",
            "extra": "mean: 45.01279147999867 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 35.0910347766111,
            "unit": "iter/sec",
            "range": "stddev: 0.0010770399509213537",
            "extra": "mean: 28.497307257137955 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 130.3504284678864,
            "unit": "iter/sec",
            "range": "stddev: 0.00015351747341913925",
            "extra": "mean: 7.671628024194518 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 218.67039907817744,
            "unit": "iter/sec",
            "range": "stddev: 0.00010124645340851691",
            "extra": "mean: 4.573092673793892 msec\nrounds: 187"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.4560460847155,
            "unit": "iter/sec",
            "range": "stddev: 0.00030084855384641994",
            "extra": "mean: 4.751585989586952 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 181.7151609555332,
            "unit": "iter/sec",
            "range": "stddev: 0.00011781681121159806",
            "extra": "mean: 5.503118147883687 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 107.92342171295418,
            "unit": "iter/sec",
            "range": "stddev: 0.00047616261393941273",
            "extra": "mean: 9.265829271608137 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 181.36906803747257,
            "unit": "iter/sec",
            "range": "stddev: 0.00034531098572047864",
            "extra": "mean: 5.513619333333016 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 230.09051250796847,
            "unit": "iter/sec",
            "range": "stddev: 0.00018704204096924208",
            "extra": "mean: 4.346115748537733 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 150.2471501023053,
            "unit": "iter/sec",
            "range": "stddev: 0.013248617542968586",
            "extra": "mean: 6.655700286621653 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 156.69610120849902,
            "unit": "iter/sec",
            "range": "stddev: 0.0002556406444723663",
            "extra": "mean: 6.381779714285329 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.6664940132286,
            "unit": "iter/sec",
            "range": "stddev: 0.00014133265179373794",
            "extra": "mean: 4.746839333345558 msec\nrounds: 6"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8d66c1cd9a7d70f772451504aa3ef4280420ccd6",
          "message": "Merge pull request #113 from stnkvcmls/claude/screenshot-code-analysis-vvihh0\n\nFix CV model race predictions being faster than threshold pace",
          "timestamp": "2026-07-01T06:12:09+02:00",
          "tree_id": "7da375834e05ef406b517cf219ee193d7e7a2b1e",
          "url": "https://github.com/stnkvcmls/running-coach/commit/8d66c1cd9a7d70f772451504aa3ef4280420ccd6"
        },
        "date": 1782879187513,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 366.22441928980106,
            "unit": "iter/sec",
            "range": "stddev: 0.000207985442714253",
            "extra": "mean: 2.7305661428564627 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 85.90706460354158,
            "unit": "iter/sec",
            "range": "stddev: 0.0007346574794072962",
            "extra": "mean: 11.6404861999996 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 64.9644669006158,
            "unit": "iter/sec",
            "range": "stddev: 0.013399666013718564",
            "extra": "mean: 15.393030185714045 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 69.61559604989675,
            "unit": "iter/sec",
            "range": "stddev: 0.017751318049035125",
            "extra": "mean: 14.364597256098378 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.30673364472382,
            "unit": "iter/sec",
            "range": "stddev: 0.00037893085406196284",
            "extra": "mean: 12.935483791045542 msec\nrounds: 67"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 159.88324831854746,
            "unit": "iter/sec",
            "range": "stddev: 0.00015290283716050304",
            "extra": "mean: 6.254563942856756 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 175.79541492160524,
            "unit": "iter/sec",
            "range": "stddev: 0.00029849863003905496",
            "extra": "mean: 5.6884304999987805 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 183.01388627449555,
            "unit": "iter/sec",
            "range": "stddev: 0.00023185928663001584",
            "extra": "mean: 5.464066253967953 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 128.56613906243683,
            "unit": "iter/sec",
            "range": "stddev: 0.0006437575460503224",
            "extra": "mean: 7.778097773585316 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 177.0781826115897,
            "unit": "iter/sec",
            "range": "stddev: 0.00019409115631618035",
            "extra": "mean: 5.6472230810807424 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 278.53960765277884,
            "unit": "iter/sec",
            "range": "stddev: 0.00019166861101668867",
            "extra": "mean: 3.590153689189429 msec\nrounds: 222"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 127.81749694307427,
            "unit": "iter/sec",
            "range": "stddev: 0.011207842887433872",
            "extra": "mean: 7.823655007462455 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 209.26925008976085,
            "unit": "iter/sec",
            "range": "stddev: 0.00019839119798070395",
            "extra": "mean: 4.778532916666327 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 254.66245183610016,
            "unit": "iter/sec",
            "range": "stddev: 0.00015552455275222142",
            "extra": "mean: 3.926766560166461 msec\nrounds: 241"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 257.76510428199873,
            "unit": "iter/sec",
            "range": "stddev: 0.00031169988614063626",
            "extra": "mean: 3.8795010782607164 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 229.64210761124914,
            "unit": "iter/sec",
            "range": "stddev: 0.00014152354060768875",
            "extra": "mean: 4.3546020823535345 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 103.31685783679617,
            "unit": "iter/sec",
            "range": "stddev: 0.0009920824711929575",
            "extra": "mean: 9.678962571428988 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.960656190437508,
            "unit": "iter/sec",
            "range": "stddev: 0.0007835399930105089",
            "extra": "mean: 35.76453975861976 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 153.0247727787586,
            "unit": "iter/sec",
            "range": "stddev: 0.0006769330285486852",
            "extra": "mean: 6.534889625000706 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 193.67315073414449,
            "unit": "iter/sec",
            "range": "stddev: 0.00032420533170069896",
            "extra": "mean: 5.163338316175286 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 59.16416799682264,
            "unit": "iter/sec",
            "range": "stddev: 0.0006064032539982846",
            "extra": "mean: 16.90212224489837 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.415835349237084,
            "unit": "iter/sec",
            "range": "stddev: 0.05511831787664698",
            "extra": "mean: 155.864348999996 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.740071782304053,
            "unit": "iter/sec",
            "range": "stddev: 0.03130863134965007",
            "extra": "mean: 50.658377083331985 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 31.963028763681045,
            "unit": "iter/sec",
            "range": "stddev: 0.0012088837807525004",
            "extra": "mean: 31.28614648485003 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 119.82805619834888,
            "unit": "iter/sec",
            "range": "stddev: 0.0005014325091551675",
            "extra": "mean: 8.345291008849554 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 200.5408293068049,
            "unit": "iter/sec",
            "range": "stddev: 0.0002615109447815991",
            "extra": "mean: 4.9865157307697805 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 193.4994755732621,
            "unit": "iter/sec",
            "range": "stddev: 0.00037143843725172173",
            "extra": "mean: 5.167972662651396 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 166.6272693578046,
            "unit": "iter/sec",
            "range": "stddev: 0.0003918652031061706",
            "extra": "mean: 6.00141863846226 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 93.90101971889929,
            "unit": "iter/sec",
            "range": "stddev: 0.0006679953040892445",
            "extra": "mean: 10.64951161333056 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 179.6198383934845,
            "unit": "iter/sec",
            "range": "stddev: 0.0003613585277783562",
            "extra": "mean: 5.567313771930627 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 226.1433199911777,
            "unit": "iter/sec",
            "range": "stddev: 0.00018042831608193943",
            "extra": "mean: 4.421974525000394 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 181.02450891862182,
            "unit": "iter/sec",
            "range": "stddev: 0.00034299499269940396",
            "extra": "mean: 5.5241138670871495 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 144.54633133899742,
            "unit": "iter/sec",
            "range": "stddev: 0.0007332621269156271",
            "extra": "mean: 6.918197028845714 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 51.23510700578455,
            "unit": "iter/sec",
            "range": "stddev: 0.05035853955617188",
            "extra": "mean: 19.517866916665128 msec\nrounds: 12"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "829c9c4c15114780e6f88e0e98cd3ef81b397786",
          "message": "Merge pull request #114 from stnkvcmls/claude/item-p1-2-looejl\n\nAdd terrain/GAP-aware race pacing (P1-2)",
          "timestamp": "2026-07-01T06:36:43+02:00",
          "tree_id": "7501c3aee6182fcd6d25b7beefcdcecc1b9deafc",
          "url": "https://github.com/stnkvcmls/running-coach/commit/829c9c4c15114780e6f88e0e98cd3ef81b397786"
        },
        "date": 1782880657583,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 376.81535306089086,
            "unit": "iter/sec",
            "range": "stddev: 0.00020655865836509792",
            "extra": "mean: 2.653819680851503 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 87.53365778558417,
            "unit": "iter/sec",
            "range": "stddev: 0.0005712557997396705",
            "extra": "mean: 11.424177000000668 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 68.25541298591875,
            "unit": "iter/sec",
            "range": "stddev: 0.011633754098633577",
            "extra": "mean: 14.650852676055191 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 81.0441821273697,
            "unit": "iter/sec",
            "range": "stddev: 0.010880365370874725",
            "extra": "mean: 12.338948629630094 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.43253183835485,
            "unit": "iter/sec",
            "range": "stddev: 0.0002046652946712228",
            "extra": "mean: 12.432780333332024 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 164.52828623102974,
            "unit": "iter/sec",
            "range": "stddev: 0.00010565396765211497",
            "extra": "mean: 6.077982229729211 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.68513316267314,
            "unit": "iter/sec",
            "range": "stddev: 0.00008796896342971907",
            "extra": "mean: 5.534489653333499 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.94204759301834,
            "unit": "iter/sec",
            "range": "stddev: 0.00012729238395740958",
            "extra": "mean: 5.077635843750872 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 142.23788645616017,
            "unit": "iter/sec",
            "range": "stddev: 0.0001466179792536553",
            "extra": "mean: 7.030475669421697 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 189.5547141715126,
            "unit": "iter/sec",
            "range": "stddev: 0.00011866483485825414",
            "extra": "mean: 5.275521658064287 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 288.2562012021954,
            "unit": "iter/sec",
            "range": "stddev: 0.00009807153534817348",
            "extra": "mean: 3.469136122065789 msec\nrounds: 213"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 134.60012046267178,
            "unit": "iter/sec",
            "range": "stddev: 0.009721844381469086",
            "extra": "mean: 7.429413856114094 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 210.9692136305724,
            "unit": "iter/sec",
            "range": "stddev: 0.00038813475164867765",
            "extra": "mean: 4.740028096000287 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.31587993223906,
            "unit": "iter/sec",
            "range": "stddev: 0.00013315245657746636",
            "extra": "mean: 3.8563006641217132 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 273.12142036454014,
            "unit": "iter/sec",
            "range": "stddev: 0.00011513591014063416",
            "extra": "mean: 3.661375217898624 msec\nrounds: 257"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.9877860494926,
            "unit": "iter/sec",
            "range": "stddev: 0.00009543432641301312",
            "extra": "mean: 4.25554032748486 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 118.92641826269525,
            "unit": "iter/sec",
            "range": "stddev: 0.00011188969163137721",
            "extra": "mean: 8.40856064285995 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.081600130632513,
            "unit": "iter/sec",
            "range": "stddev: 0.000507168193159679",
            "extra": "mean: 34.38600336666724 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.47976851567566,
            "unit": "iter/sec",
            "range": "stddev: 0.0003903932101293402",
            "extra": "mean: 5.970870445204865 msec\nrounds: 146"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 206.10162848135877,
            "unit": "iter/sec",
            "range": "stddev: 0.00010110133774263224",
            "extra": "mean: 4.851975248174455 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 64.66284040807311,
            "unit": "iter/sec",
            "range": "stddev: 0.0002875951051014137",
            "extra": "mean: 15.464832563636511 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.463874891768146,
            "unit": "iter/sec",
            "range": "stddev: 0.04948928439623056",
            "extra": "mean: 154.705964571424 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.113295150513935,
            "unit": "iter/sec",
            "range": "stddev: 0.026639172348052086",
            "extra": "mean: 47.36352108333305 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.872621724051,
            "unit": "iter/sec",
            "range": "stddev: 0.0018111801344719684",
            "extra": "mean: 30.42045165714171 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 111.59988376396137,
            "unit": "iter/sec",
            "range": "stddev: 0.012241984180820974",
            "extra": "mean: 8.960582809521949 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 211.62059601918884,
            "unit": "iter/sec",
            "range": "stddev: 0.00011371702030777821",
            "extra": "mean: 4.7254379715919725 msec\nrounds: 176"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 210.01818256649068,
            "unit": "iter/sec",
            "range": "stddev: 0.000117458461028684",
            "extra": "mean: 4.761492494505352 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 176.95256009209942,
            "unit": "iter/sec",
            "range": "stddev: 0.00013467533441561665",
            "extra": "mean: 5.651232169116541 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 102.62923250778799,
            "unit": "iter/sec",
            "range": "stddev: 0.0002940422147668015",
            "extra": "mean: 9.74381251388697 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 184.60646449128419,
            "unit": "iter/sec",
            "range": "stddev: 0.00048576869056138626",
            "extra": "mean: 5.416928398231758 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 224.87756842205982,
            "unit": "iter/sec",
            "range": "stddev: 0.0001236469637237727",
            "extra": "mean: 4.446864162650306 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 177.46490950852248,
            "unit": "iter/sec",
            "range": "stddev: 0.00036905262643330375",
            "extra": "mean: 5.634916799999701 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 152.5839165422105,
            "unit": "iter/sec",
            "range": "stddev: 0.00048419096795299305",
            "extra": "mean: 6.55377069000167 msec\nrounds: 100"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 193.1191428688225,
            "unit": "iter/sec",
            "range": "stddev: 0.0003507559217583199",
            "extra": "mean: 5.178150571428627 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5f14aa170062b14165fce5c997802deb6add3fec",
          "message": "Merge pull request #115 from stnkvcmls/claude/p2-2-implementation-m4bxxr\n\nAdd race-aware taper/recovery automation to training plans (P2-2)",
          "timestamp": "2026-07-01T07:05:20+02:00",
          "tree_id": "5b691e97d906d527bb4c608bd5d31c06ef9a031c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/5f14aa170062b14165fce5c997802deb6add3fec"
        },
        "date": 1782882373314,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.0785544999041,
            "unit": "iter/sec",
            "range": "stddev: 0.000189052528033361",
            "extra": "mean: 2.637975660003349 msec\nrounds: 50"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 88.91337523720348,
            "unit": "iter/sec",
            "range": "stddev: 0.000559694518111334",
            "extra": "mean: 11.246901800006981 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 69.64812611687681,
            "unit": "iter/sec",
            "range": "stddev: 0.010768867808432768",
            "extra": "mean: 14.357888083333295 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 91.46681239002277,
            "unit": "iter/sec",
            "range": "stddev: 0.00008598607750110497",
            "extra": "mean: 10.932927188234236 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 81.99457089592038,
            "unit": "iter/sec",
            "range": "stddev: 0.00011446209755087983",
            "extra": "mean: 12.195929426465902 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 163.7098821130643,
            "unit": "iter/sec",
            "range": "stddev: 0.0001013717682108351",
            "extra": "mean: 6.108366746665676 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 162.5189804642379,
            "unit": "iter/sec",
            "range": "stddev: 0.007683123191452825",
            "extra": "mean: 6.153127450981326 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 195.18713147968614,
            "unit": "iter/sec",
            "range": "stddev: 0.0001029405671822201",
            "extra": "mean: 5.123288571429586 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.12294661317404,
            "unit": "iter/sec",
            "range": "stddev: 0.00010782404373703078",
            "extra": "mean: 7.086019842974625 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 187.6415488357024,
            "unit": "iter/sec",
            "range": "stddev: 0.00008992222879491139",
            "extra": "mean: 5.32931009259358 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 281.5692931792125,
            "unit": "iter/sec",
            "range": "stddev: 0.000159365693679811",
            "extra": "mean: 3.551523636363013 msec\nrounds: 231"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 135.4861319960233,
            "unit": "iter/sec",
            "range": "stddev: 0.008715868031258702",
            "extra": "mean: 7.380829205673621 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 215.9426263047208,
            "unit": "iter/sec",
            "range": "stddev: 0.00011876228150130843",
            "extra": "mean: 4.630859673758347 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.343741916491,
            "unit": "iter/sec",
            "range": "stddev: 0.0001117216852050492",
            "extra": "mean: 3.855886371540059 msec\nrounds: 253"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 271.7064597955039,
            "unit": "iter/sec",
            "range": "stddev: 0.00012434385096802119",
            "extra": "mean: 3.6804424920652825 msec\nrounds: 252"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 232.6830491570426,
            "unit": "iter/sec",
            "range": "stddev: 0.00009400764981228728",
            "extra": "mean: 4.297691660921459 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 118.5923354079456,
            "unit": "iter/sec",
            "range": "stddev: 0.00008358924882527163",
            "extra": "mean: 8.432248142850897 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.46193089317897,
            "unit": "iter/sec",
            "range": "stddev: 0.0003435082206544342",
            "extra": "mean: 33.942106633327285 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 169.76595947631813,
            "unit": "iter/sec",
            "range": "stddev: 0.00010067389583061566",
            "extra": "mean: 5.890462393548908 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 204.5082384034449,
            "unit": "iter/sec",
            "range": "stddev: 0.00011266972699670727",
            "extra": "mean: 4.889778562500958 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 61.53477462234831,
            "unit": "iter/sec",
            "range": "stddev: 0.0008996214019418795",
            "extra": "mean: 16.250973634618923 msec\nrounds: 52"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.1747985072825875,
            "unit": "iter/sec",
            "range": "stddev: 0.04411258444288669",
            "extra": "mean: 161.9486042857261 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.755888361040373,
            "unit": "iter/sec",
            "range": "stddev: 0.02527485476575171",
            "extra": "mean: 45.96456754166667 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.91336521452458,
            "unit": "iter/sec",
            "range": "stddev: 0.0013880200662133105",
            "extra": "mean: 30.38279414706287 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 127.40586704727511,
            "unit": "iter/sec",
            "range": "stddev: 0.0004444534746670384",
            "extra": "mean: 7.848932103173404 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 209.2490271144944,
            "unit": "iter/sec",
            "range": "stddev: 0.00024125636243242318",
            "extra": "mean: 4.778994740333162 msec\nrounds: 181"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 209.06467963621952,
            "unit": "iter/sec",
            "range": "stddev: 0.0001272791202178103",
            "extra": "mean: 4.783208726313972 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 152.05143214647757,
            "unit": "iter/sec",
            "range": "stddev: 0.010415391892829952",
            "extra": "mean: 6.57672200704205 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 105.75816175391927,
            "unit": "iter/sec",
            "range": "stddev: 0.00012489349593076637",
            "extra": "mean: 9.455535000001465 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 186.31061228969804,
            "unit": "iter/sec",
            "range": "stddev: 0.00014020155529869178",
            "extra": "mean: 5.3673807826098505 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 226.12237831139112,
            "unit": "iter/sec",
            "range": "stddev: 0.00010198712351962721",
            "extra": "mean: 4.422384053571686 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 180.72944764055737,
            "unit": "iter/sec",
            "range": "stddev: 0.00032104729489782136",
            "extra": "mean: 5.533132608189252 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 150.25959257805368,
            "unit": "iter/sec",
            "range": "stddev: 0.0009575399693677531",
            "extra": "mean: 6.65514915116345 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 208.71043613169886,
            "unit": "iter/sec",
            "range": "stddev: 0.00010789029846772872",
            "extra": "mean: 4.791327250013448 msec\nrounds: 12"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ba31231cf38d301a87ea0534deba05ef80e41a13",
          "message": "Merge pull request #116 from stnkvcmls/claude/p2-1-implementation-llwy22\n\nAdd fuelling/hydration guidance for long runs and races (P2-1)",
          "timestamp": "2026-07-01T07:32:51+02:00",
          "tree_id": "cbcdb066b155298c6e9e12318813ba32f15795a4",
          "url": "https://github.com/stnkvcmls/running-coach/commit/ba31231cf38d301a87ea0534deba05ef80e41a13"
        },
        "date": 1782884025996,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 380.46206463378934,
            "unit": "iter/sec",
            "range": "stddev: 0.00017648300744169725",
            "extra": "mean: 2.628382939998346 msec\nrounds: 50"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 89.11684899647454,
            "unit": "iter/sec",
            "range": "stddev: 0.0005354241354671483",
            "extra": "mean: 11.221222599999692 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 69.29588264047925,
            "unit": "iter/sec",
            "range": "stddev: 0.011318613909609058",
            "extra": "mean: 14.430871819444135 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 92.13647863316342,
            "unit": "iter/sec",
            "range": "stddev: 0.00010410190409867921",
            "extra": "mean: 10.85346449999948 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 82.26113184987294,
            "unit": "iter/sec",
            "range": "stddev: 0.0001749684499176737",
            "extra": "mean: 12.156409442858214 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 165.74483456565204,
            "unit": "iter/sec",
            "range": "stddev: 0.00007667664462154865",
            "extra": "mean: 6.033370527778932 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 163.60268978828293,
            "unit": "iter/sec",
            "range": "stddev: 0.0079017154168611",
            "extra": "mean: 6.112368942675044 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 199.05272766332362,
            "unit": "iter/sec",
            "range": "stddev: 0.00009663076965343917",
            "extra": "mean: 5.023794507811985 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.64903647028962,
            "unit": "iter/sec",
            "range": "stddev: 0.00017899878885880072",
            "extra": "mean: 7.059702098360171 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 190.13283049173626,
            "unit": "iter/sec",
            "range": "stddev: 0.00009904257642384535",
            "extra": "mean: 5.259480950311015 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 287.1673852831815,
            "unit": "iter/sec",
            "range": "stddev: 0.00009888733050575952",
            "extra": "mean: 3.4822896026785215 msec\nrounds: 224"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 136.18101842533883,
            "unit": "iter/sec",
            "range": "stddev: 0.009101957903088376",
            "extra": "mean: 7.343167289854346 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 218.59071806696673,
            "unit": "iter/sec",
            "range": "stddev: 0.00011861187313605732",
            "extra": "mean: 4.574759664285669 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 263.20058543627596,
            "unit": "iter/sec",
            "range": "stddev: 0.00011086720462553877",
            "extra": "mean: 3.7993836462879456 msec\nrounds: 229"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 277.1406242234575,
            "unit": "iter/sec",
            "range": "stddev: 0.00008754196749894631",
            "extra": "mean: 3.6082764942959193 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 235.7229335236426,
            "unit": "iter/sec",
            "range": "stddev: 0.0001129689945439429",
            "extra": "mean: 4.242268603447961 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 121.29082898381597,
            "unit": "iter/sec",
            "range": "stddev: 0.00009138864266359907",
            "extra": "mean: 8.244646428572366 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.095913806988005,
            "unit": "iter/sec",
            "range": "stddev: 0.0003145500053486073",
            "extra": "mean: 34.3690872413785 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 170.19034259209693,
            "unit": "iter/sec",
            "range": "stddev: 0.0004059780695808681",
            "extra": "mean: 5.875774058442001 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 146.95970115163175,
            "unit": "iter/sec",
            "range": "stddev: 0.00023942466439511606",
            "extra": "mean: 6.804586510203969 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 57.620711025676265,
            "unit": "iter/sec",
            "range": "stddev: 0.0006839366948799521",
            "extra": "mean: 17.35487088235325 msec\nrounds: 51"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.170246482047389,
            "unit": "iter/sec",
            "range": "stddev: 0.004098334933622079",
            "extra": "mean: 139.46521957142824 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.80058132958149,
            "unit": "iter/sec",
            "range": "stddev: 0.02989388922554971",
            "extra": "mean: 48.07557943478496 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.31306035078611,
            "unit": "iter/sec",
            "range": "stddev: 0.0010928479672379916",
            "extra": "mean: 30.018256787878766 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 129.2421422459407,
            "unit": "iter/sec",
            "range": "stddev: 0.00010008231303878704",
            "extra": "mean: 7.737414303277757 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 213.74183528765704,
            "unit": "iter/sec",
            "range": "stddev: 0.0001130277328629673",
            "extra": "mean: 4.678541281608182 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 211.41152972900343,
            "unit": "iter/sec",
            "range": "stddev: 0.00012179236886727208",
            "extra": "mean: 4.730110989130271 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.1564929674174,
            "unit": "iter/sec",
            "range": "stddev: 0.0001151447719869871",
            "extra": "mean: 5.644726779412595 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 105.92415269954294,
            "unit": "iter/sec",
            "range": "stddev: 0.00017322185635922175",
            "extra": "mean: 9.440717480521464 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 181.9663814113068,
            "unit": "iter/sec",
            "range": "stddev: 0.00069521152322377",
            "extra": "mean: 5.495520613445925 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.39736658321348,
            "unit": "iter/sec",
            "range": "stddev: 0.00024803885020740997",
            "extra": "mean: 4.397588305553492 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 180.6873682194589,
            "unit": "iter/sec",
            "range": "stddev: 0.00033397642809542347",
            "extra": "mean: 5.534421193104224 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 155.50527318312862,
            "unit": "iter/sec",
            "range": "stddev: 0.00019289528618279095",
            "extra": "mean: 6.430650096491351 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 193.35933334995025,
            "unit": "iter/sec",
            "range": "stddev: 0.00046588863592437324",
            "extra": "mean: 5.171718285717069 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "58b9244ee8f318c8e9c14c3d6fc96065c6d629c2",
          "message": "Merge pull request #117 from stnkvcmls/claude/p3-3-implementation-o2ecwz\n\nAdd user-defined custom chart builder (P3-3)",
          "timestamp": "2026-07-01T14:57:06+02:00",
          "tree_id": "0a9633caa813c4081dc4adb63ab2fc1997d5ad87",
          "url": "https://github.com/stnkvcmls/running-coach/commit/58b9244ee8f318c8e9c14c3d6fc96065c6d629c2"
        },
        "date": 1782910683856,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 321.25295849882826,
            "unit": "iter/sec",
            "range": "stddev: 0.000886032690952934",
            "extra": "mean: 3.112811799999804 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 70.13907062700656,
            "unit": "iter/sec",
            "range": "stddev: 0.00041373502127127097",
            "extra": "mean: 14.257388800001536 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 61.61982872109155,
            "unit": "iter/sec",
            "range": "stddev: 0.0008932787983202368",
            "extra": "mean: 16.228542350000314 msec\nrounds: 60"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 65.27302830510067,
            "unit": "iter/sec",
            "range": "stddev: 0.0195466826821648",
            "extra": "mean: 15.320263606060644 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 65.8376020466928,
            "unit": "iter/sec",
            "range": "stddev: 0.0010393713307448801",
            "extra": "mean: 15.188888551724416 msec\nrounds: 58"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 120.15706340392806,
            "unit": "iter/sec",
            "range": "stddev: 0.002001311046305571",
            "extra": "mean: 8.322440409835357 msec\nrounds: 61"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 152.0296140590106,
            "unit": "iter/sec",
            "range": "stddev: 0.0007175447298916124",
            "extra": "mean: 6.577665846154472 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 155.453537330332,
            "unit": "iter/sec",
            "range": "stddev: 0.0006495421503539429",
            "extra": "mean: 6.432790254717997 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 119.26356433621876,
            "unit": "iter/sec",
            "range": "stddev: 0.000710124402865695",
            "extra": "mean: 8.384790489582183 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 154.21831972336207,
            "unit": "iter/sec",
            "range": "stddev: 0.0006433765807404588",
            "extra": "mean: 6.484313937499819 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 257.79441537047825,
            "unit": "iter/sec",
            "range": "stddev: 0.0005352114960758351",
            "extra": "mean: 3.879059981043005 msec\nrounds: 211"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 111.0700640542603,
            "unit": "iter/sec",
            "range": "stddev: 0.0155042965627961",
            "extra": "mean: 9.003326040322412 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 198.67766755933124,
            "unit": "iter/sec",
            "range": "stddev: 0.00044343647033544134",
            "extra": "mean: 5.033278336133926 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 228.78331182278058,
            "unit": "iter/sec",
            "range": "stddev: 0.000855913787283415",
            "extra": "mean: 4.370948178137298 msec\nrounds: 247"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 253.4118776486527,
            "unit": "iter/sec",
            "range": "stddev: 0.0007756090787540368",
            "extra": "mean: 3.9461449450544985 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 212.1150954239321,
            "unit": "iter/sec",
            "range": "stddev: 0.0008809858293065203",
            "extra": "mean: 4.714421658682072 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 93.9312747802365,
            "unit": "iter/sec",
            "range": "stddev: 0.0007698997554061471",
            "extra": "mean: 10.646081428572327 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 22.48956620939481,
            "unit": "iter/sec",
            "range": "stddev: 0.03606602840654257",
            "extra": "mean: 44.4650639629616 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 128.2586219466891,
            "unit": "iter/sec",
            "range": "stddev: 0.0007523358775181965",
            "extra": "mean: 7.796746798165754 msec\nrounds: 109"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 125.05889210817934,
            "unit": "iter/sec",
            "range": "stddev: 0.0006085873722169569",
            "extra": "mean: 7.996232679999859 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 51.94895519250345,
            "unit": "iter/sec",
            "range": "stddev: 0.0010716982942329844",
            "extra": "mean: 19.24966529729757 msec\nrounds: 37"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.64956630685285,
            "unit": "iter/sec",
            "range": "stddev: 0.0042446315865335765",
            "extra": "mean: 115.6127330000029 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.473278464709495,
            "unit": "iter/sec",
            "range": "stddev: 0.04329443466932777",
            "extra": "mean: 57.23024457142856 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.53821503687496,
            "unit": "iter/sec",
            "range": "stddev: 0.0011947669997904161",
            "extra": "mean: 26.639519194444087 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 105.46082415187983,
            "unit": "iter/sec",
            "range": "stddev: 0.0009412610537138253",
            "extra": "mean: 9.482194056817212 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 211.14734205558847,
            "unit": "iter/sec",
            "range": "stddev: 0.000271084366567782",
            "extra": "mean: 4.736029306666485 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 194.41710039934654,
            "unit": "iter/sec",
            "range": "stddev: 0.0002950679811428226",
            "extra": "mean: 5.143580466666403 msec\nrounds: 90"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 159.91590451626578,
            "unit": "iter/sec",
            "range": "stddev: 0.0007257567142864133",
            "extra": "mean: 6.253286707316128 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 83.5548835471749,
            "unit": "iter/sec",
            "range": "stddev: 0.0007854483991295439",
            "extra": "mean: 11.968181362318603 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 164.89547821497766,
            "unit": "iter/sec",
            "range": "stddev: 0.0005270634800375496",
            "extra": "mean: 6.064447678160581 msec\nrounds: 87"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 208.94216388451272,
            "unit": "iter/sec",
            "range": "stddev: 0.0008213965681023",
            "extra": "mean: 4.786013418300405 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 128.13486855821398,
            "unit": "iter/sec",
            "range": "stddev: 0.017613511210401632",
            "extra": "mean: 7.80427694078979 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 140.1251555852419,
            "unit": "iter/sec",
            "range": "stddev: 0.00047485772557530163",
            "extra": "mean: 7.136477357141438 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 189.43987766723546,
            "unit": "iter/sec",
            "range": "stddev: 0.0009105046402002497",
            "extra": "mean: 5.278719625001926 msec\nrounds: 8"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8601281c4815cc15a5e166738f8815e689a894d4",
          "message": "Merge pull request #118 from stnkvcmls/claude/p3-2-implementation-2s4iup\n\nAdd per-week strength progression and exercise demo links (P3-2)",
          "timestamp": "2026-07-01T22:29:33+02:00",
          "tree_id": "8d79337e8aa66cd6b994087b307aac2eaf8995b0",
          "url": "https://github.com/stnkvcmls/running-coach/commit/8601281c4815cc15a5e166738f8815e689a894d4"
        },
        "date": 1782937842329,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 352.88461241384414,
            "unit": "iter/sec",
            "range": "stddev: 0.00033295731397901265",
            "extra": "mean: 2.833787489796392 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 77.66083453982695,
            "unit": "iter/sec",
            "range": "stddev: 0.001558298001457916",
            "extra": "mean: 12.876503400013917 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 69.82780172088066,
            "unit": "iter/sec",
            "range": "stddev: 0.00048357812428423993",
            "extra": "mean: 14.320943454546262 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 71.52609528889575,
            "unit": "iter/sec",
            "range": "stddev: 0.016234255872294476",
            "extra": "mean: 13.980911385711384 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 71.05331438178882,
            "unit": "iter/sec",
            "range": "stddev: 0.0008618485457966582",
            "extra": "mean: 14.073938826086668 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 149.1437353381721,
            "unit": "iter/sec",
            "range": "stddev: 0.00035478537970812094",
            "extra": "mean: 6.704941362321226 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 148.78600219939892,
            "unit": "iter/sec",
            "range": "stddev: 0.011714447959906546",
            "extra": "mean: 6.721062366201811 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 176.06044273254287,
            "unit": "iter/sec",
            "range": "stddev: 0.0004974961760597223",
            "extra": "mean: 5.679867575473049 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 126.06217384837112,
            "unit": "iter/sec",
            "range": "stddev: 0.0005508166991271659",
            "extra": "mean: 7.932593651786541 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 160.23724525936078,
            "unit": "iter/sec",
            "range": "stddev: 0.000707288305905398",
            "extra": "mean: 6.240746328242196 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 281.3315746202765,
            "unit": "iter/sec",
            "range": "stddev: 0.00016840334692965755",
            "extra": "mean: 3.554524590244577 msec\nrounds: 205"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 115.0228928883985,
            "unit": "iter/sec",
            "range": "stddev: 0.014912121864045686",
            "extra": "mean: 8.693921487179553 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 207.8385754602124,
            "unit": "iter/sec",
            "range": "stddev: 0.00031249612658607506",
            "extra": "mean: 4.811426357141459 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 253.18610422748117,
            "unit": "iter/sec",
            "range": "stddev: 0.00022935197423337443",
            "extra": "mean: 3.9496638374020945 msec\nrounds: 246"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 263.32797269486883,
            "unit": "iter/sec",
            "range": "stddev: 0.0003650005406975744",
            "extra": "mean: 3.7975456605164757 msec\nrounds: 271"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 215.044139672892,
            "unit": "iter/sec",
            "range": "stddev: 0.00036455300394618267",
            "extra": "mean: 4.650208099235442 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 103.0853519470596,
            "unit": "iter/sec",
            "range": "stddev: 0.0005095490008546226",
            "extra": "mean: 9.70069928570995 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.53545174457326,
            "unit": "iter/sec",
            "range": "stddev: 0.0006673685093084944",
            "extra": "mean: 36.31681837931285 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 149.15094327914346,
            "unit": "iter/sec",
            "range": "stddev: 0.0006382941210549554",
            "extra": "mean: 6.70461733606639 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 136.0274187186107,
            "unit": "iter/sec",
            "range": "stddev: 0.0005914757366730399",
            "extra": "mean: 7.351459061857389 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 57.31895763049105,
            "unit": "iter/sec",
            "range": "stddev: 0.0009751401357633941",
            "extra": "mean: 17.446234916666487 msec\nrounds: 48"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.832501098910035,
            "unit": "iter/sec",
            "range": "stddev: 0.0057604756208662535",
            "extra": "mean: 146.359288571432 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.341235598218937,
            "unit": "iter/sec",
            "range": "stddev: 0.031916263355705965",
            "extra": "mean: 51.70300495652337 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 30.7969512065396,
            "unit": "iter/sec",
            "range": "stddev: 0.0018949202168884157",
            "extra": "mean: 32.47074664285776 msec\nrounds: 28"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 100.89128843944299,
            "unit": "iter/sec",
            "range": "stddev: 0.016169927766575148",
            "extra": "mean: 9.911658533335316 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 206.13104066231855,
            "unit": "iter/sec",
            "range": "stddev: 0.00038278262168583424",
            "extra": "mean: 4.851282935296427 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 196.64645899946436,
            "unit": "iter/sec",
            "range": "stddev: 0.0006659334477665823",
            "extra": "mean: 5.085268278350864 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 165.3132090182762,
            "unit": "iter/sec",
            "range": "stddev: 0.0006292968353435824",
            "extra": "mean: 6.049123393941527 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 78.07909578424318,
            "unit": "iter/sec",
            "range": "stddev: 0.0015306260106139984",
            "extra": "mean: 12.807525368420134 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 167.8923488066962,
            "unit": "iter/sec",
            "range": "stddev: 0.0007413879073438679",
            "extra": "mean: 5.956197570095083 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 214.6285093296302,
            "unit": "iter/sec",
            "range": "stddev: 0.0007751982478561884",
            "extra": "mean: 4.6592132756426246 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 168.66149961107212,
            "unit": "iter/sec",
            "range": "stddev: 0.0011406914792664441",
            "extra": "mean: 5.929035389261729 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 138.99070264978673,
            "unit": "iter/sec",
            "range": "stddev: 0.0008532640036064979",
            "extra": "mean: 7.194725840905262 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 176.38420147878045,
            "unit": "iter/sec",
            "range": "stddev: 0.0008538244165625225",
            "extra": "mean: 5.669441999998526 msec\nrounds: 6"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7ab511433a484178bdc2ee7906726af7f8fd82e7",
          "message": "Merge pull request #119 from stnkvcmls/claude/p3-1-implementation-hck9kp\n\nAdd season-long periodization skeleton (P3-1)",
          "timestamp": "2026-07-01T23:20:45+02:00",
          "tree_id": "216f56d23af2422f4d4f5082e0d93946acc26d8f",
          "url": "https://github.com/stnkvcmls/running-coach/commit/7ab511433a484178bdc2ee7906726af7f8fd82e7"
        },
        "date": 1782940899397,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 414.2993006605109,
            "unit": "iter/sec",
            "range": "stddev: 0.0002556609044743085",
            "extra": "mean: 2.4137139464288637 msec\nrounds: 56"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 78.69080037972053,
            "unit": "iter/sec",
            "range": "stddev: 0.0010226848314456019",
            "extra": "mean: 12.707965799998533 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 71.06743724926079,
            "unit": "iter/sec",
            "range": "stddev: 0.0008119710075484783",
            "extra": "mean: 14.071141984374869 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 87.03903907308987,
            "unit": "iter/sec",
            "range": "stddev: 0.00047316815919471204",
            "extra": "mean: 11.489097428571833 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.29417377641532,
            "unit": "iter/sec",
            "range": "stddev: 0.0004316756937188982",
            "extra": "mean: 12.937585734374313 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 169.606691923082,
            "unit": "iter/sec",
            "range": "stddev: 0.0001290090488698194",
            "extra": "mean: 5.895993776315784 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 184.7116392714788,
            "unit": "iter/sec",
            "range": "stddev: 0.0002038517773977381",
            "extra": "mean: 5.413843999999676 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 194.40676343353798,
            "unit": "iter/sec",
            "range": "stddev: 0.00030227888352802343",
            "extra": "mean: 5.1438539603169255 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 137.76439632132565,
            "unit": "iter/sec",
            "range": "stddev: 0.00042868119309111036",
            "extra": "mean: 7.258769513042914 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 183.44235636531627,
            "unit": "iter/sec",
            "range": "stddev: 0.00023222856120466302",
            "extra": "mean: 5.4513037218544556 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 251.78118566942373,
            "unit": "iter/sec",
            "range": "stddev: 0.01036888130635625",
            "extra": "mean: 3.9717026406927425 msec\nrounds: 231"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 153.3760278237901,
            "unit": "iter/sec",
            "range": "stddev: 0.00016587275320803388",
            "extra": "mean: 6.51992370769228 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 234.7075137767884,
            "unit": "iter/sec",
            "range": "stddev: 0.00016263072358636057",
            "extra": "mean: 4.260622013792964 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 238.71526260369444,
            "unit": "iter/sec",
            "range": "stddev: 0.01017698901753773",
            "extra": "mean: 4.189091175373064 msec\nrounds: 268"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 289.39267787549454,
            "unit": "iter/sec",
            "range": "stddev: 0.00013025594802932138",
            "extra": "mean: 3.455512445377869 msec\nrounds: 238"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 244.22946615842378,
            "unit": "iter/sec",
            "range": "stddev: 0.00015117358608643416",
            "extra": "mean: 4.094510034883883 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 107.40611665866258,
            "unit": "iter/sec",
            "range": "stddev: 0.00036316133322194426",
            "extra": "mean: 9.310456714285717 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 27.12049841879961,
            "unit": "iter/sec",
            "range": "stddev: 0.0023233871064671776",
            "extra": "mean: 36.872478689654606 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 157.16692107376915,
            "unit": "iter/sec",
            "range": "stddev: 0.00028910845826906766",
            "extra": "mean: 6.362662023076928 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 138.49984917708264,
            "unit": "iter/sec",
            "range": "stddev: 0.000842473699960406",
            "extra": "mean: 7.220224469135873 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 56.72477123224513,
            "unit": "iter/sec",
            "range": "stddev: 0.0004434928930953054",
            "extra": "mean: 17.628982511110614 msec\nrounds: 45"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.454176771414102,
            "unit": "iter/sec",
            "range": "stddev: 0.06690183388072068",
            "extra": "mean: 134.15297633333344 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.20446192794512,
            "unit": "iter/sec",
            "range": "stddev: 0.038886390684204526",
            "extra": "mean: 52.071232391305024 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 40.826701390020936,
            "unit": "iter/sec",
            "range": "stddev: 0.0012110396880774187",
            "extra": "mean: 24.493774073171263 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 127.79127784868277,
            "unit": "iter/sec",
            "range": "stddev: 0.0002627069514781635",
            "extra": "mean: 7.825260196428247 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 225.94868546942521,
            "unit": "iter/sec",
            "range": "stddev: 0.00012284244070950005",
            "extra": "mean: 4.4257836593402855 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 219.21398778681205,
            "unit": "iter/sec",
            "range": "stddev: 0.00015269368913529041",
            "extra": "mean: 4.561752696969824 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 180.5623603580949,
            "unit": "iter/sec",
            "range": "stddev: 0.0002586100105034383",
            "extra": "mean: 5.538252812030037 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 92.91503424152705,
            "unit": "iter/sec",
            "range": "stddev: 0.0005996948262214602",
            "extra": "mean: 10.762520922077691 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 198.3380564533599,
            "unit": "iter/sec",
            "range": "stddev: 0.000255136582902075",
            "extra": "mean: 5.041896738738863 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 181.47623896197837,
            "unit": "iter/sec",
            "range": "stddev: 0.01617521975449696",
            "extra": "mean: 5.510363261437841 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 182.06510488230415,
            "unit": "iter/sec",
            "range": "stddev: 0.0004488096769209176",
            "extra": "mean: 5.492540707602642 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 151.58551697075998,
            "unit": "iter/sec",
            "range": "stddev: 0.0002851843167998258",
            "extra": "mean: 6.596936303571103 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 211.75996619597066,
            "unit": "iter/sec",
            "range": "stddev: 0.00026224075125773745",
            "extra": "mean: 4.722327916668452 msec\nrounds: 12"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "23ac813a37b5dcadf31016d986525cb715bc97ff",
          "message": "Merge pull request #120 from stnkvcmls/claude/p3-4-implementation-jwj63x\n\nRefuse startup on unauthenticated public bind (P3-4)",
          "timestamp": "2026-07-01T23:29:58+02:00",
          "tree_id": "9deb4365fe113c8bcc872ce8b60cec1f440039e9",
          "url": "https://github.com/stnkvcmls/running-coach/commit/23ac813a37b5dcadf31016d986525cb715bc97ff"
        },
        "date": 1782941456716,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 365.30219818738414,
            "unit": "iter/sec",
            "range": "stddev: 0.00026328936695504566",
            "extra": "mean: 2.737459574461809 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 83.33493891973576,
            "unit": "iter/sec",
            "range": "stddev: 0.0008176715886281722",
            "extra": "mean: 11.999768800012589 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 67.85238751546026,
            "unit": "iter/sec",
            "range": "stddev: 0.01176969816887549",
            "extra": "mean: 14.737874916665957 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 79.9305242222635,
            "unit": "iter/sec",
            "range": "stddev: 0.012603851032087497",
            "extra": "mean: 12.510865025972947 msec\nrounds: 77"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.19493870614411,
            "unit": "iter/sec",
            "range": "stddev: 0.00021445880553083417",
            "extra": "mean: 12.469614867644824 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 161.19939911402034,
            "unit": "iter/sec",
            "range": "stddev: 0.0001248548320301872",
            "extra": "mean: 6.203497069444254 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 179.97547630308435,
            "unit": "iter/sec",
            "range": "stddev: 0.0000776296321743935",
            "extra": "mean: 5.556312562918121 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 191.80973366344472,
            "unit": "iter/sec",
            "range": "stddev: 0.00012940669922714237",
            "extra": "mean: 5.213499757810158 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 135.56152271149784,
            "unit": "iter/sec",
            "range": "stddev: 0.00019789431790351737",
            "extra": "mean: 7.376724456896231 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 180.5401262986714,
            "unit": "iter/sec",
            "range": "stddev: 0.00033168216515904413",
            "extra": "mean: 5.538934864516925 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 275.967637091307,
            "unit": "iter/sec",
            "range": "stddev: 0.00037622664305233476",
            "extra": "mean: 3.6236132995157644 msec\nrounds: 207"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 129.03983789853618,
            "unit": "iter/sec",
            "range": "stddev: 0.010782009628608674",
            "extra": "mean: 7.749544762961485 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 211.5118373680349,
            "unit": "iter/sec",
            "range": "stddev: 0.00016769597134970609",
            "extra": "mean: 4.727867775362283 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 256.0577841805973,
            "unit": "iter/sec",
            "range": "stddev: 0.00011718651849018419",
            "extra": "mean: 3.9053684823527997 msec\nrounds: 255"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 238.30788004786632,
            "unit": "iter/sec",
            "range": "stddev: 0.007924607888124872",
            "extra": "mean: 4.1962523429738905 msec\nrounds: 242"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 231.21991819158586,
            "unit": "iter/sec",
            "range": "stddev: 0.00012842293301144515",
            "extra": "mean: 4.324886920734108 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 115.26496117172803,
            "unit": "iter/sec",
            "range": "stddev: 0.00034258318265924345",
            "extra": "mean: 8.67566335714238 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.03214000155446,
            "unit": "iter/sec",
            "range": "stddev: 0.00047361997286536937",
            "extra": "mean: 34.444584517243904 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 167.26900355182994,
            "unit": "iter/sec",
            "range": "stddev: 0.00016054346324496707",
            "extra": "mean: 5.9783939568345685 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 147.9620261098639,
            "unit": "iter/sec",
            "range": "stddev: 0.00011229478611645196",
            "extra": "mean: 6.758490852629214 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 60.00863325742078,
            "unit": "iter/sec",
            "range": "stddev: 0.0004154275592368207",
            "extra": "mean: 16.664268884616497 msec\nrounds: 52"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.813463205119221,
            "unit": "iter/sec",
            "range": "stddev: 0.010159804554912819",
            "extra": "mean: 146.76823957142102 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.448380320236698,
            "unit": "iter/sec",
            "range": "stddev: 0.03427395304335278",
            "extra": "mean: 51.418163545447854 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 31.260308086594335,
            "unit": "iter/sec",
            "range": "stddev: 0.0014251961323043369",
            "extra": "mean: 31.98944799999715 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 123.36817669942107,
            "unit": "iter/sec",
            "range": "stddev: 0.0006611302816811632",
            "extra": "mean: 8.105818102803271 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 211.5966160198342,
            "unit": "iter/sec",
            "range": "stddev: 0.00011327449027099614",
            "extra": "mean: 4.725973500002779 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 211.43715848615898,
            "unit": "iter/sec",
            "range": "stddev: 0.00013217013406227184",
            "extra": "mean: 4.729537642104955 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 146.79296343184146,
            "unit": "iter/sec",
            "range": "stddev: 0.012577815000176714",
            "extra": "mean: 6.812315635717222 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 104.84494313319203,
            "unit": "iter/sec",
            "range": "stddev: 0.00030460327435886914",
            "extra": "mean: 9.537894438357686 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.48075938354347,
            "unit": "iter/sec",
            "range": "stddev: 0.00027711222215122237",
            "extra": "mean: 5.480029803570525 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 228.51209680992972,
            "unit": "iter/sec",
            "range": "stddev: 0.00010898173873514114",
            "extra": "mean: 4.376135941861203 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 178.61297270356857,
            "unit": "iter/sec",
            "range": "stddev: 0.00044013530303319145",
            "extra": "mean: 5.598697479043865 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 154.4309038236165,
            "unit": "iter/sec",
            "range": "stddev: 0.00017789897665291564",
            "extra": "mean: 6.475387861111994 msec\nrounds: 108"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 200.75177158390764,
            "unit": "iter/sec",
            "range": "stddev: 0.0003407997403263771",
            "extra": "mean: 4.9812760909162535 msec\nrounds: 11"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "bafbcb714e438dc8ada8434456b6a301174f7079",
          "message": "Merge pull request #121 from stnkvcmls/claude/p3-5-implementation-qfvhv0\n\nAdd contract/edge tests for weather + chat context (P3-5)",
          "timestamp": "2026-07-01T23:45:18+02:00",
          "tree_id": "1281b9ef444e35ed6a2f901e5252ffad919f0dd9",
          "url": "https://github.com/stnkvcmls/running-coach/commit/bafbcb714e438dc8ada8434456b6a301174f7079"
        },
        "date": 1782942369991,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 411.3937179053157,
            "unit": "iter/sec",
            "range": "stddev: 0.00021839153300334108",
            "extra": "mean: 2.430761473684328 msec\nrounds: 57"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 86.8076036724142,
            "unit": "iter/sec",
            "range": "stddev: 0.0005427060570959959",
            "extra": "mean: 11.519728200005375 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 67.9656394998498,
            "unit": "iter/sec",
            "range": "stddev: 0.012684283421341397",
            "extra": "mean: 14.713317013697928 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 92.23176064524901,
            "unit": "iter/sec",
            "range": "stddev: 0.00010564460982395577",
            "extra": "mean: 10.842252094116468 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.79185904228012,
            "unit": "iter/sec",
            "range": "stddev: 0.0001859229944985321",
            "extra": "mean: 12.377484710144849 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 170.3616689337502,
            "unit": "iter/sec",
            "range": "stddev: 0.00009949592631037081",
            "extra": "mean: 5.869865012820915 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 185.87760299553173,
            "unit": "iter/sec",
            "range": "stddev: 0.00013302689348871938",
            "extra": "mean: 5.379884310343935 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 199.89829391750385,
            "unit": "iter/sec",
            "range": "stddev: 0.00010907970897140741",
            "extra": "mean: 5.002543945736178 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 124.89802726583093,
            "unit": "iter/sec",
            "range": "stddev: 0.010550100228500984",
            "extra": "mean: 8.006531583334109 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 189.4517382177025,
            "unit": "iter/sec",
            "range": "stddev: 0.00009793736432172008",
            "extra": "mean: 5.27838915286637 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 299.44625679515275,
            "unit": "iter/sec",
            "range": "stddev: 0.00011525975542108585",
            "extra": "mean: 3.3394974133341293 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 134.64555650881485,
            "unit": "iter/sec",
            "range": "stddev: 0.01064229332375912",
            "extra": "mean: 7.426906805755101 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 234.57051575514507,
            "unit": "iter/sec",
            "range": "stddev: 0.00012029853422603353",
            "extra": "mean: 4.263110377622411 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 275.58986276490447,
            "unit": "iter/sec",
            "range": "stddev: 0.00016218386533675428",
            "extra": "mean: 3.6285804926470138 msec\nrounds: 272"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 286.12391265566185,
            "unit": "iter/sec",
            "range": "stddev: 0.00011769799183598188",
            "extra": "mean: 3.4949892538463154 msec\nrounds: 260"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 242.1334936036319,
            "unit": "iter/sec",
            "range": "stddev: 0.00014148819155659619",
            "extra": "mean: 4.129953213482236 msec\nrounds: 178"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 114.54480434750728,
            "unit": "iter/sec",
            "range": "stddev: 0.00012954489516458825",
            "extra": "mean: 8.730208285713152 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 28.47739312125255,
            "unit": "iter/sec",
            "range": "stddev: 0.0013744814716944904",
            "extra": "mean: 35.115573807691845 msec\nrounds: 26"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 166.83891198184585,
            "unit": "iter/sec",
            "range": "stddev: 0.00012011532526392782",
            "extra": "mean: 5.993805570422399 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 148.6205293265126,
            "unit": "iter/sec",
            "range": "stddev: 0.00011543082943869261",
            "extra": "mean: 6.728545541666353 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 58.26493708506082,
            "unit": "iter/sec",
            "range": "stddev: 0.0013115921734917857",
            "extra": "mean: 17.162980859999948 msec\nrounds: 50"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.8829036149589955,
            "unit": "iter/sec",
            "range": "stddev: 0.04827836209510475",
            "extra": "mean: 126.85680922221978 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.272024961723233,
            "unit": "iter/sec",
            "range": "stddev: 0.029949849841858844",
            "extra": "mean: 49.32906317391366 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.51575143243862,
            "unit": "iter/sec",
            "range": "stddev: 0.0013938414718180105",
            "extra": "mean: 24.087243166665726 msec\nrounds: 42"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 110.33635354788561,
            "unit": "iter/sec",
            "range": "stddev: 0.014045943231025343",
            "extra": "mean: 9.063196016950146 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 222.4502437423746,
            "unit": "iter/sec",
            "range": "stddev: 0.0001256386840443466",
            "extra": "mean: 4.495387297296585 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 217.40863633853175,
            "unit": "iter/sec",
            "range": "stddev: 0.00010940133756309636",
            "extra": "mean: 4.599633284313867 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 183.43472934336327,
            "unit": "iter/sec",
            "range": "stddev: 0.0001297461674052375",
            "extra": "mean: 5.451530381295162 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 102.01096786685831,
            "unit": "iter/sec",
            "range": "stddev: 0.00015777293706569612",
            "extra": "mean: 9.802867484848985 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 194.85832258027025,
            "unit": "iter/sec",
            "range": "stddev: 0.00013994915969860772",
            "extra": "mean: 5.131933739130175 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 234.67085865689154,
            "unit": "iter/sec",
            "range": "stddev: 0.00010934629709893689",
            "extra": "mean: 4.261287514450543 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 186.06587611595117,
            "unit": "iter/sec",
            "range": "stddev: 0.00024566729999311924",
            "extra": "mean: 5.374440606061626 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 158.7539026287145,
            "unit": "iter/sec",
            "range": "stddev: 0.00012524389837977395",
            "extra": "mean: 6.299057745614914 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 212.66215610248486,
            "unit": "iter/sec",
            "range": "stddev: 0.00013300414979630057",
            "extra": "mean: 4.702294090905793 msec\nrounds: 11"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7f71bb7e52aadda137f9a89ca0fada08b88bd79a",
          "message": "Merge pull request #122 from stnkvcmls/claude/codebase-state-docs-0gsq60\n\nRefresh CURRENT_STATE.md to reflect v4 plan delivery",
          "timestamp": "2026-07-02T00:30:30+02:00",
          "tree_id": "fce478f2c4aaa52372a6c8961f8f05a3432da8f1",
          "url": "https://github.com/stnkvcmls/running-coach/commit/7f71bb7e52aadda137f9a89ca0fada08b88bd79a"
        },
        "date": 1782945089343,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 383.7567093987518,
            "unit": "iter/sec",
            "range": "stddev: 0.0001933576602644273",
            "extra": "mean: 2.605817632652581 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 89.81910020050996,
            "unit": "iter/sec",
            "range": "stddev: 0.0005894489005286359",
            "extra": "mean: 11.13348940000094 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 69.35473518617492,
            "unit": "iter/sec",
            "range": "stddev: 0.010891674247368399",
            "extra": "mean: 14.418626173333564 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 74.05459186738634,
            "unit": "iter/sec",
            "range": "stddev: 0.015428748756013919",
            "extra": "mean: 13.50355156626554 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 79.70774256106439,
            "unit": "iter/sec",
            "range": "stddev: 0.00025201501017235186",
            "extra": "mean: 12.545832661537194 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 165.69267326096139,
            "unit": "iter/sec",
            "range": "stddev: 0.00008590470630347629",
            "extra": "mean: 6.035269878379158 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 183.44140970934995,
            "unit": "iter/sec",
            "range": "stddev: 0.00008811052185755296",
            "extra": "mean: 5.451331853502597 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 198.21778271130395,
            "unit": "iter/sec",
            "range": "stddev: 0.00013630403260223267",
            "extra": "mean: 5.044956039370387 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.8042007490074,
            "unit": "iter/sec",
            "range": "stddev: 0.0001460917400211217",
            "extra": "mean: 7.051977266667819 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 189.06222955708805,
            "unit": "iter/sec",
            "range": "stddev: 0.00013013518890186596",
            "extra": "mean: 5.289263764331344 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 252.4377378555554,
            "unit": "iter/sec",
            "range": "stddev: 0.007149451356184284",
            "extra": "mean: 3.9613728458151485 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 152.71901918059416,
            "unit": "iter/sec",
            "range": "stddev: 0.00012660252338394826",
            "extra": "mean: 6.547972907143113 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 221.1399100557558,
            "unit": "iter/sec",
            "range": "stddev: 0.00010913450408911357",
            "extra": "mean: 4.522024087591746 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 261.6331552574855,
            "unit": "iter/sec",
            "range": "stddev: 0.00013242548033448544",
            "extra": "mean: 3.822145549618331 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 272.0464418028184,
            "unit": "iter/sec",
            "range": "stddev: 0.00016766679513148855",
            "extra": "mean: 3.6758429677415476 msec\nrounds: 248"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 234.22029857168198,
            "unit": "iter/sec",
            "range": "stddev: 0.0001230066905774165",
            "extra": "mean: 4.269484780346461 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 120.10766828867574,
            "unit": "iter/sec",
            "range": "stddev: 0.00021463698109777803",
            "extra": "mean: 8.325863071427923 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.580582711448457,
            "unit": "iter/sec",
            "range": "stddev: 0.00024579876756726575",
            "extra": "mean: 33.80596013793109 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 171.29529820512604,
            "unit": "iter/sec",
            "range": "stddev: 0.00011563636103752804",
            "extra": "mean: 5.83787185333307 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 124.98320761333416,
            "unit": "iter/sec",
            "range": "stddev: 0.012253889215910635",
            "extra": "mean: 8.001074857141948 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 63.016496038218406,
            "unit": "iter/sec",
            "range": "stddev: 0.00029334601152228166",
            "extra": "mean: 15.868860740741876 msec\nrounds: 54"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.174212364680028,
            "unit": "iter/sec",
            "range": "stddev: 0.007575787628822089",
            "extra": "mean: 139.38812362499675 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.339449405091884,
            "unit": "iter/sec",
            "range": "stddev: 0.02582080908979033",
            "extra": "mean: 46.861565217394336 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 29.506889967286927,
            "unit": "iter/sec",
            "range": "stddev: 0.02309327375169479",
            "extra": "mean: 33.890389705884246 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 127.9525832975715,
            "unit": "iter/sec",
            "range": "stddev: 0.0005200608515311005",
            "extra": "mean: 7.815395158332686 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 213.59376537117825,
            "unit": "iter/sec",
            "range": "stddev: 0.00016399181158829299",
            "extra": "mean: 4.68178459358223 msec\nrounds: 187"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 209.87964163362966,
            "unit": "iter/sec",
            "range": "stddev: 0.000261859871265339",
            "extra": "mean: 4.764635541667357 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 178.6207855499039,
            "unit": "iter/sec",
            "range": "stddev: 0.00011274915962275965",
            "extra": "mean: 5.5984525928569235 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 106.13941269124966,
            "unit": "iter/sec",
            "range": "stddev: 0.0003157322482064165",
            "extra": "mean: 9.421570881581127 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 186.46913422053203,
            "unit": "iter/sec",
            "range": "stddev: 0.0002837643986811821",
            "extra": "mean: 5.362817842106388 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.71242047326717,
            "unit": "iter/sec",
            "range": "stddev: 0.00011442331138824672",
            "extra": "mean: 4.391503976470169 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 175.64435568444554,
            "unit": "iter/sec",
            "range": "stddev: 0.0011375574817760934",
            "extra": "mean: 5.693322715115044 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 156.4672605699517,
            "unit": "iter/sec",
            "range": "stddev: 0.00020274899607493276",
            "extra": "mean: 6.3911133636351405 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 206.81057842724206,
            "unit": "iter/sec",
            "range": "stddev: 0.00018917385497030918",
            "extra": "mean: 4.835342600000558 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "32409497800be3c8d61f12d5e63c722e1bc97bf8",
          "message": "Merge pull request #123 from stnkvcmls/claude/p3-1-implementation-tccwiw\n\nP3-1: Split monolithic api.py and ai_coach.py into domain routers",
          "timestamp": "2026-07-04T02:41:46+02:00",
          "tree_id": "14ed6a410fb313dabfde56a68032cdd6227bda7c",
          "url": "https://github.com/stnkvcmls/running-coach/commit/32409497800be3c8d61f12d5e63c722e1bc97bf8"
        },
        "date": 1783125759520,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 379.002308795243,
            "unit": "iter/sec",
            "range": "stddev: 0.00019341848127094735",
            "extra": "mean: 2.63850635416644 msec\nrounds: 48"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 54.472690519705324,
            "unit": "iter/sec",
            "range": "stddev: 0.01649780009217252",
            "extra": "mean: 18.35782280000018 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 68.31023110170263,
            "unit": "iter/sec",
            "range": "stddev: 0.011905634422765973",
            "extra": "mean: 14.639095547944574 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 83.00206290495561,
            "unit": "iter/sec",
            "range": "stddev: 0.01044962412211058",
            "extra": "mean: 12.047893329411398 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 81.55684172201212,
            "unit": "iter/sec",
            "range": "stddev: 0.0002044783357798733",
            "extra": "mean: 12.2613870140842 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 166.10974260129487,
            "unit": "iter/sec",
            "range": "stddev: 0.00007725970807398927",
            "extra": "mean: 6.020116486485993 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.91530740284696,
            "unit": "iter/sec",
            "range": "stddev: 0.00012129907220599463",
            "extra": "mean: 5.467011012903535 msec\nrounds: 155"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 197.6477270208234,
            "unit": "iter/sec",
            "range": "stddev: 0.00011233010533651046",
            "extra": "mean: 5.059506704545324 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.8190133288354,
            "unit": "iter/sec",
            "range": "stddev: 0.00009362461479740692",
            "extra": "mean: 7.051240708333673 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 189.46018856242983,
            "unit": "iter/sec",
            "range": "stddev: 0.0000922691421070665",
            "extra": "mean: 5.278153725000045 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 290.1934082283627,
            "unit": "iter/sec",
            "range": "stddev: 0.00009058206663747251",
            "extra": "mean: 3.4459776536793942 msec\nrounds: 231"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 136.75830403187567,
            "unit": "iter/sec",
            "range": "stddev: 0.008828758263163757",
            "extra": "mean: 7.3121702340423855 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 217.7516857048885,
            "unit": "iter/sec",
            "range": "stddev: 0.00023140618174289946",
            "extra": "mean: 4.5923869510487565 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 231.14337386756495,
            "unit": "iter/sec",
            "range": "stddev: 0.006822064013910606",
            "extra": "mean: 4.3263191294116705 msec\nrounds: 255"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.4096052477031,
            "unit": "iter/sec",
            "range": "stddev: 0.00009810915895336118",
            "extra": "mean: 3.6178192834646787 msec\nrounds: 254"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 235.63348881915115,
            "unit": "iter/sec",
            "range": "stddev: 0.00010740827293354955",
            "extra": "mean: 4.243878936781777 msec\nrounds: 174"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 118.48947116948558,
            "unit": "iter/sec",
            "range": "stddev: 0.00011415844313127278",
            "extra": "mean: 8.439568428570457 msec\nrounds: 14"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 29.467809388107124,
            "unit": "iter/sec",
            "range": "stddev: 0.00048358691492643403",
            "extra": "mean: 33.935335566667156 msec\nrounds: 30"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 170.3448639513604,
            "unit": "iter/sec",
            "range": "stddev: 0.00010611322956787601",
            "extra": "mean: 5.870444090909228 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 148.9045233146099,
            "unit": "iter/sec",
            "range": "stddev: 0.0001643450846946303",
            "extra": "mean: 6.715712711340343 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 52.56150027469329,
            "unit": "iter/sec",
            "range": "stddev: 0.0004902435773448559",
            "extra": "mean: 19.025332130435185 msec\nrounds: 46"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.657968785923893,
            "unit": "iter/sec",
            "range": "stddev: 0.0028903404487199144",
            "extra": "mean: 130.58292975000097 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.980305417750333,
            "unit": "iter/sec",
            "range": "stddev: 0.027117742867124338",
            "extra": "mean: 45.49527320000038 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 34.210335508438135,
            "unit": "iter/sec",
            "range": "stddev: 0.001965728633680251",
            "extra": "mean: 29.230932264705366 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 115.1768445540582,
            "unit": "iter/sec",
            "range": "stddev: 0.011388159343469822",
            "extra": "mean: 8.682300716535522 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 215.70120629917702,
            "unit": "iter/sec",
            "range": "stddev: 0.00010069957488245585",
            "extra": "mean: 4.636042686812806 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 213.99649880553346,
            "unit": "iter/sec",
            "range": "stddev: 0.00010485631929986641",
            "extra": "mean: 4.67297364948357 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 179.89044470641042,
            "unit": "iter/sec",
            "range": "stddev: 0.00010616979212174079",
            "extra": "mean: 5.558938951049049 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 105.49483185835825,
            "unit": "iter/sec",
            "range": "stddev: 0.00017571435735597816",
            "extra": "mean: 9.47913734146372 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 187.1378618714514,
            "unit": "iter/sec",
            "range": "stddev: 0.0002710499884402602",
            "extra": "mean: 5.343654084745926 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 230.6915718738829,
            "unit": "iter/sec",
            "range": "stddev: 0.00009719156003562218",
            "extra": "mean: 4.334792085714736 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 181.84660251511266,
            "unit": "iter/sec",
            "range": "stddev: 0.000859364245347615",
            "extra": "mean: 5.499140408283918 msec\nrounds: 169"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 157.68441095384037,
            "unit": "iter/sec",
            "range": "stddev: 0.00012145644119144278",
            "extra": "mean: 6.341780991227689 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.4782935052383,
            "unit": "iter/sec",
            "range": "stddev: 0.0002151310115351706",
            "extra": "mean: 4.751083749997775 msec\nrounds: 8"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7966e9c1a4071c9b19443f3b9abe75956ec004fa",
          "message": "Merge pull request #124 from stnkvcmls/claude/item-p0-2-implementation-9k7qqe\n\nImplement P0-2: personal records & peak performances",
          "timestamp": "2026-07-04T12:01:13-07:00",
          "tree_id": "7a360df23b7888838d329ffb5c3995a33fe7b4f7",
          "url": "https://github.com/stnkvcmls/running-coach/commit/7966e9c1a4071c9b19443f3b9abe75956ec004fa"
        },
        "date": 1783191729077,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 384.97102653056953,
            "unit": "iter/sec",
            "range": "stddev: 0.0002047157778600863",
            "extra": "mean: 2.5975980816327553 msec\nrounds: 49"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 77.43368176839414,
            "unit": "iter/sec",
            "range": "stddev: 0.0006431611267494744",
            "extra": "mean: 12.914276799997992 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 66.62878604813916,
            "unit": "iter/sec",
            "range": "stddev: 0.0005657447956290444",
            "extra": "mean: 15.008527984848802 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 81.68980448689605,
            "unit": "iter/sec",
            "range": "stddev: 0.0001756050119200201",
            "extra": "mean: 12.241429714284736 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 69.45429083276159,
            "unit": "iter/sec",
            "range": "stddev: 0.00061973437559332",
            "extra": "mean: 14.397958542372734 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 147.09692595956034,
            "unit": "iter/sec",
            "range": "stddev: 0.0003879980185326556",
            "extra": "mean: 6.7982386000025485 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 178.7343589830573,
            "unit": "iter/sec",
            "range": "stddev: 0.000676153179525885",
            "extra": "mean: 5.594895159999946 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 192.52272781301176,
            "unit": "iter/sec",
            "range": "stddev: 0.000159028730719077",
            "extra": "mean: 5.194191934425804 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 136.08216586743103,
            "unit": "iter/sec",
            "range": "stddev: 0.00035095690236338565",
            "extra": "mean: 7.348501499999518 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 177.6161256767183,
            "unit": "iter/sec",
            "range": "stddev: 0.00029310347180226464",
            "extra": "mean: 5.630119428571 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 301.180894796649,
            "unit": "iter/sec",
            "range": "stddev: 0.00024706607582895926",
            "extra": "mean: 3.3202637261409924 msec\nrounds: 241"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 129.65193546266266,
            "unit": "iter/sec",
            "range": "stddev: 0.012538764066738511",
            "extra": "mean: 7.712958517985111 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 229.46151452384376,
            "unit": "iter/sec",
            "range": "stddev: 0.0001740977822346194",
            "extra": "mean: 4.358029284671562 msec\nrounds: 137"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 274.5926787255173,
            "unit": "iter/sec",
            "range": "stddev: 0.0001399006396707608",
            "extra": "mean: 3.6417576923075923 msec\nrounds: 273"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 279.36234268847295,
            "unit": "iter/sec",
            "range": "stddev: 0.00016576705684179658",
            "extra": "mean: 3.5795805203249462 msec\nrounds: 246"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 215.77119500081477,
            "unit": "iter/sec",
            "range": "stddev: 0.00029588186024124923",
            "extra": "mean: 4.6345389151514125 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 103.43224459369763,
            "unit": "iter/sec",
            "range": "stddev: 0.0008529562690257278",
            "extra": "mean: 9.668164931817909 msec\nrounds: 44"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 95.57403186155494,
            "unit": "iter/sec",
            "range": "stddev: 0.017950966052179548",
            "extra": "mean: 10.463093170000022 msec\nrounds: 100"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 157.60725548330248,
            "unit": "iter/sec",
            "range": "stddev: 0.00038219963664783916",
            "extra": "mean: 6.344885563380322 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 147.0964180324398,
            "unit": "iter/sec",
            "range": "stddev: 0.0001113948029902174",
            "extra": "mean: 6.798262074467821 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 48.02652760346013,
            "unit": "iter/sec",
            "range": "stddev: 0.0005618173178194841",
            "extra": "mean: 20.821825976191413 msec\nrounds: 42"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.714856256419862,
            "unit": "iter/sec",
            "range": "stddev: 0.0038430127389889194",
            "extra": "mean: 114.74658566667036 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.60847319945751,
            "unit": "iter/sec",
            "range": "stddev: 0.03526298883811508",
            "extra": "mean: 50.998361260868904 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 40.2027303889388,
            "unit": "iter/sec",
            "range": "stddev: 0.0008408379082981757",
            "extra": "mean: 24.87393244999936 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 123.76367028867372,
            "unit": "iter/sec",
            "range": "stddev: 0.001181770121366743",
            "extra": "mean: 8.079915516948882 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 224.91966584632604,
            "unit": "iter/sec",
            "range": "stddev: 0.00011669040455871412",
            "extra": "mean: 4.446031858695893 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 220.86092983574036,
            "unit": "iter/sec",
            "range": "stddev: 0.000125707665265041",
            "extra": "mean: 4.527736076922815 msec\nrounds: 104"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 145.25217835903666,
            "unit": "iter/sec",
            "range": "stddev: 0.01596511620362103",
            "extra": "mean: 6.884578333332695 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 93.4604975318224,
            "unit": "iter/sec",
            "range": "stddev: 0.0007891785364548059",
            "extra": "mean: 10.699707645569825 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 192.91588797482768,
            "unit": "iter/sec",
            "range": "stddev: 0.00019766688511532062",
            "extra": "mean: 5.183606236363919 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 234.51453897741484,
            "unit": "iter/sec",
            "range": "stddev: 0.00013137933342821613",
            "extra": "mean: 4.264127948571692 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 186.0502697495269,
            "unit": "iter/sec",
            "range": "stddev: 0.0006542100456987793",
            "extra": "mean: 5.3748914277107245 msec\nrounds: 166"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 160.9929289827159,
            "unit": "iter/sec",
            "range": "stddev: 0.00016497698818168736",
            "extra": "mean: 6.211452927273342 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.18274885574226,
            "unit": "iter/sec",
            "range": "stddev: 0.00036471372299182604",
            "extra": "mean: 4.757764400000042 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8c1182eb62e7a63227da0bb49cd7da7c94cb43f2",
          "message": "Merge pull request #125 from stnkvcmls/claude/p0-1-implementation-ggtc2v\n\nAdd Web Push notifications (P0-1)",
          "timestamp": "2026-07-04T16:56:20-07:00",
          "tree_id": "65b773b9d234e4e303ce7d20aea3fec770645a77",
          "url": "https://github.com/stnkvcmls/running-coach/commit/8c1182eb62e7a63227da0bb49cd7da7c94cb43f2"
        },
        "date": 1783209439294,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 348.38699338189747,
            "unit": "iter/sec",
            "range": "stddev: 0.00023272760578533635",
            "extra": "mean: 2.8703712222224453 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 88.40814504239779,
            "unit": "iter/sec",
            "range": "stddev: 0.0006570295359225421",
            "extra": "mean: 11.311175000000636 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 68.68348070143394,
            "unit": "iter/sec",
            "range": "stddev: 0.01183053660751047",
            "extra": "mean: 14.559541679999958 msec\nrounds: 75"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 73.78262703196631,
            "unit": "iter/sec",
            "range": "stddev: 0.015762751330791212",
            "extra": "mean: 13.553326036585148 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 81.15085941518974,
            "unit": "iter/sec",
            "range": "stddev: 0.00016440844913321822",
            "extra": "mean: 12.322728400000418 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 147.10171665933808,
            "unit": "iter/sec",
            "range": "stddev: 0.0002968666972482139",
            "extra": "mean: 6.798017200001993 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 182.4573149065067,
            "unit": "iter/sec",
            "range": "stddev: 0.00008559349804184795",
            "extra": "mean: 5.480733948717879 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 195.48899239217494,
            "unit": "iter/sec",
            "range": "stddev: 0.00010907921665728276",
            "extra": "mean: 5.115377534883791 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 141.17003379768792,
            "unit": "iter/sec",
            "range": "stddev: 0.00013034766185129326",
            "extra": "mean: 7.083656305084614 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 187.16839978761334,
            "unit": "iter/sec",
            "range": "stddev: 0.00011492962636514674",
            "extra": "mean: 5.342782227847947 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 250.19264264864674,
            "unit": "iter/sec",
            "range": "stddev: 0.00783030539045568",
            "extra": "mean: 3.996920090909031 msec\nrounds: 220"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 152.00479119101544,
            "unit": "iter/sec",
            "range": "stddev: 0.00009371275410357567",
            "extra": "mean: 6.578740000000125 msec\nrounds: 139"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 220.4131606240921,
            "unit": "iter/sec",
            "range": "stddev: 0.00011530975330475717",
            "extra": "mean: 4.536934170212593 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 266.2231427631692,
            "unit": "iter/sec",
            "range": "stddev: 0.00010175969230328603",
            "extra": "mean: 3.756247445736132 msec\nrounds: 258"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 267.57242500145253,
            "unit": "iter/sec",
            "range": "stddev: 0.000779081477441482",
            "extra": "mean: 3.737305890151317 msec\nrounds: 264"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 203.24367435226648,
            "unit": "iter/sec",
            "range": "stddev: 0.008994078328402707",
            "extra": "mean: 4.920202329479527 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 118.22412164636788,
            "unit": "iter/sec",
            "range": "stddev: 0.00010037147740253157",
            "extra": "mean: 8.458510717391508 msec\nrounds: 46"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 134.25576143288976,
            "unit": "iter/sec",
            "range": "stddev: 0.000114265436384552",
            "extra": "mean: 7.448469915385112 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 166.44668948078439,
            "unit": "iter/sec",
            "range": "stddev: 0.0002995006927655181",
            "extra": "mean: 6.007929644737368 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 147.0886205873609,
            "unit": "iter/sec",
            "range": "stddev: 0.00012953073531374082",
            "extra": "mean: 6.7986224631569385 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 51.78511012959728,
            "unit": "iter/sec",
            "range": "stddev: 0.00023782734564099572",
            "extra": "mean: 19.310570113636963 msec\nrounds: 44"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.213326090700303,
            "unit": "iter/sec",
            "range": "stddev: 0.009758222143330669",
            "extra": "mean: 138.6323018571472 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 21.502369304788317,
            "unit": "iter/sec",
            "range": "stddev: 0.02697481815692815",
            "extra": "mean: 46.50650288000179 msec\nrounds: 25"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 33.59412886526481,
            "unit": "iter/sec",
            "range": "stddev: 0.0015953157749156812",
            "extra": "mean: 29.767106151514653 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 112.51970154712089,
            "unit": "iter/sec",
            "range": "stddev: 0.012158725211312098",
            "extra": "mean: 8.887332496000454 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.94737529092933,
            "unit": "iter/sec",
            "range": "stddev: 0.00018119696937204778",
            "extra": "mean: 4.740518807692412 msec\nrounds: 182"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 211.4640671071965,
            "unit": "iter/sec",
            "range": "stddev: 0.00009446061602553295",
            "extra": "mean: 4.728935812499409 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.0386870442743,
            "unit": "iter/sec",
            "range": "stddev: 0.0001601064104609933",
            "extra": "mean: 5.648482920289153 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 103.50315738172932,
            "unit": "iter/sec",
            "range": "stddev: 0.00014165902555216938",
            "extra": "mean: 9.661541012820571 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 186.63304832710176,
            "unit": "iter/sec",
            "range": "stddev: 0.0002389050007822039",
            "extra": "mean: 5.3581078429762 msec\nrounds: 121"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 219.77503065603182,
            "unit": "iter/sec",
            "range": "stddev: 0.0009557234233062744",
            "extra": "mean: 4.550107430379988 msec\nrounds: 158"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 183.06311850871333,
            "unit": "iter/sec",
            "range": "stddev: 0.00047094325795504327",
            "extra": "mean: 5.46259677070017 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 152.70519370084463,
            "unit": "iter/sec",
            "range": "stddev: 0.00025725065926785796",
            "extra": "mean: 6.548565741379029 msec\nrounds: 116"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 209.1427031452776,
            "unit": "iter/sec",
            "range": "stddev: 0.00016452742118373107",
            "extra": "mean: 4.781424285720196 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "c5709e1184b56c1a3b050d733799c901f46490cd",
          "message": "Merge pull request #126 from stnkvcmls/claude/p1-1-implementation-geeljv\n\nImplement P1-1: per-run RPE + daily check-in (subjective feedback)",
          "timestamp": "2026-07-06T00:45:23-07:00",
          "tree_id": "9f96069fb547839993f771c8f545c15fbe72dfa6",
          "url": "https://github.com/stnkvcmls/running-coach/commit/c5709e1184b56c1a3b050d733799c901f46490cd"
        },
        "date": 1783323977320,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 333.32072269951846,
            "unit": "iter/sec",
            "range": "stddev: 0.0004617602322173608",
            "extra": "mean: 3.0001134999982546 msec\nrounds: 6"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 79.43900457414288,
            "unit": "iter/sec",
            "range": "stddev: 0.000687782550022679",
            "extra": "mean: 12.588274555563808 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 60.4262665179135,
            "unit": "iter/sec",
            "range": "stddev: 0.018692427910683755",
            "extra": "mean: 16.549094584613265 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 76.90052410991046,
            "unit": "iter/sec",
            "range": "stddev: 0.017092124022605102",
            "extra": "mean: 13.003812543211602 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 75.17216716140118,
            "unit": "iter/sec",
            "range": "stddev: 0.00025310345733294557",
            "extra": "mean: 13.302795938461013 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 143.4481410008731,
            "unit": "iter/sec",
            "range": "stddev: 0.00033370820488846155",
            "extra": "mean: 6.971160400007648 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 153.14032553086355,
            "unit": "iter/sec",
            "range": "stddev: 0.013163861237411754",
            "extra": "mean: 6.529958693332295 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 191.08441919339845,
            "unit": "iter/sec",
            "range": "stddev: 0.00018028180337064178",
            "extra": "mean: 5.233289057376729 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 133.3087662883855,
            "unit": "iter/sec",
            "range": "stddev: 0.00021251453081802982",
            "extra": "mean: 7.501382150943549 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 175.14689881441848,
            "unit": "iter/sec",
            "range": "stddev: 0.00027133904845861337",
            "extra": "mean: 5.709493041378805 msec\nrounds: 145"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 294.34282978437716,
            "unit": "iter/sec",
            "range": "stddev: 0.00018285443453403848",
            "extra": "mean: 3.3973988791660283 msec\nrounds: 240"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 110.84859312016977,
            "unit": "iter/sec",
            "range": "stddev: 0.017406967501722964",
            "extra": "mean: 9.021314315788482 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 218.26588166739657,
            "unit": "iter/sec",
            "range": "stddev: 0.00022818462538015774",
            "extra": "mean: 4.581568096491806 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 273.6143854817253,
            "unit": "iter/sec",
            "range": "stddev: 0.00018074473159722485",
            "extra": "mean: 3.654778597402328 msec\nrounds: 231"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 282.7700588835709,
            "unit": "iter/sec",
            "range": "stddev: 0.0001631147007755011",
            "extra": "mean: 3.5364423091616803 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 239.44585611475878,
            "unit": "iter/sec",
            "range": "stddev: 0.00016905479936903586",
            "extra": "mean: 4.176309484849602 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 93.77832398437691,
            "unit": "iter/sec",
            "range": "stddev: 0.00044747842673660445",
            "extra": "mean: 10.663445000004437 msec\nrounds: 41"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 109.72310841495539,
            "unit": "iter/sec",
            "range": "stddev: 0.000495595348908695",
            "extra": "mean: 9.113850440858442 msec\nrounds: 93"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 143.5458452180201,
            "unit": "iter/sec",
            "range": "stddev: 0.00036961649905667735",
            "extra": "mean: 6.966415492424608 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 122.85547711664869,
            "unit": "iter/sec",
            "range": "stddev: 0.0008946461168352767",
            "extra": "mean: 8.1396452439033 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 38.58754907130706,
            "unit": "iter/sec",
            "range": "stddev: 0.0003009264166509799",
            "extra": "mean: 25.915094999997816 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.069965478937638,
            "unit": "iter/sec",
            "range": "stddev: 0.0720081954232749",
            "extra": "mean: 141.44340633333107 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 17.901133730875102,
            "unit": "iter/sec",
            "range": "stddev: 0.04481772560768737",
            "extra": "mean: 55.86238363636395 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 37.83661028443242,
            "unit": "iter/sec",
            "range": "stddev: 0.0014876910853173764",
            "extra": "mean: 26.429428864864313 msec\nrounds: 37"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 118.9988696074299,
            "unit": "iter/sec",
            "range": "stddev: 0.0004545290286817333",
            "extra": "mean: 8.403441169642534 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 210.96118215323858,
            "unit": "iter/sec",
            "range": "stddev: 0.00032782573626829797",
            "extra": "mean: 4.74020855302952 msec\nrounds: 132"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 209.51960095129925,
            "unit": "iter/sec",
            "range": "stddev: 0.0002340466488554352",
            "extra": "mean: 4.772823141413103 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 171.12860647973818,
            "unit": "iter/sec",
            "range": "stddev: 0.00033465486616745225",
            "extra": "mean: 5.8435583656692796 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 77.86025920973272,
            "unit": "iter/sec",
            "range": "stddev: 0.0023104590890144824",
            "extra": "mean: 12.843522615385766 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 181.30532970928877,
            "unit": "iter/sec",
            "range": "stddev: 0.00029066191427684873",
            "extra": "mean: 5.515557659575891 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 225.90993578788593,
            "unit": "iter/sec",
            "range": "stddev: 0.00029416574331561765",
            "extra": "mean: 4.426542801282242 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 128.32918447007017,
            "unit": "iter/sec",
            "range": "stddev: 0.01990439033890238",
            "extra": "mean: 7.792459713115584 msec\nrounds: 122"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 151.30072234816882,
            "unit": "iter/sec",
            "range": "stddev: 0.0006854744661205323",
            "extra": "mean: 6.609353772276309 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 201.54064216953304,
            "unit": "iter/sec",
            "range": "stddev: 0.0006224873138142567",
            "extra": "mean: 4.961778374998005 msec\nrounds: 8"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9e9448ae961c01ea796a3055a69ddf8372cf7c15",
          "message": "Merge pull request #127 from stnkvcmls/claude/workout-activity-tag-update-0qz90n\n\nTag activities that fulfil scheduled workouts on Today view",
          "timestamp": "2026-07-06T00:45:35-07:00",
          "tree_id": "d4440f674b2e975279e88ffa19e8b35b9d15abea",
          "url": "https://github.com/stnkvcmls/running-coach/commit/9e9448ae961c01ea796a3055a69ddf8372cf7c15"
        },
        "date": 1783323993090,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 317.4586041916698,
            "unit": "iter/sec",
            "range": "stddev: 0.0003646897849882396",
            "extra": "mean: 3.150016999999902 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 81.70567829861605,
            "unit": "iter/sec",
            "range": "stddev: 0.0005837120589380063",
            "extra": "mean: 12.239051444444568 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 62.988724068003826,
            "unit": "iter/sec",
            "range": "stddev: 0.015964711696353853",
            "extra": "mean: 15.875857382352768 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 67.73819079204941,
            "unit": "iter/sec",
            "range": "stddev: 0.02126487431734236",
            "extra": "mean: 14.762720827161099 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 75.06015330227217,
            "unit": "iter/sec",
            "range": "stddev: 0.0002431584344931943",
            "extra": "mean: 13.322647983050798 msec\nrounds: 59"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 144.37132582188582,
            "unit": "iter/sec",
            "range": "stddev: 0.0002809700268361049",
            "extra": "mean: 6.926583200002767 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 181.2949919036146,
            "unit": "iter/sec",
            "range": "stddev: 0.0000845411417176306",
            "extra": "mean: 5.51587216778525 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 189.16355165652504,
            "unit": "iter/sec",
            "range": "stddev: 0.00015765983880916575",
            "extra": "mean: 5.286430664062369 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 133.5770960668285,
            "unit": "iter/sec",
            "range": "stddev: 0.0001425612292643186",
            "extra": "mean: 7.486313368421342 msec\nrounds: 114"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 182.54546514990648,
            "unit": "iter/sec",
            "range": "stddev: 0.00016747980639759873",
            "extra": "mean: 5.4780873311687 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 288.8204379427726,
            "unit": "iter/sec",
            "range": "stddev: 0.00013484788214565018",
            "extra": "mean: 3.4623588521742414 msec\nrounds: 230"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 126.56684731528306,
            "unit": "iter/sec",
            "range": "stddev: 0.014108237989175786",
            "extra": "mean: 7.900963176470377 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 216.5315388499769,
            "unit": "iter/sec",
            "range": "stddev: 0.00019548346403379296",
            "extra": "mean: 4.618264874073824 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 265.1634214452145,
            "unit": "iter/sec",
            "range": "stddev: 0.00010152502602470836",
            "extra": "mean: 3.7712592277989225 msec\nrounds: 259"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 276.3011307088193,
            "unit": "iter/sec",
            "range": "stddev: 0.0001250882034383806",
            "extra": "mean: 3.6192396224894665 msec\nrounds: 249"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 227.21583107943516,
            "unit": "iter/sec",
            "range": "stddev: 0.0007499747554474669",
            "extra": "mean: 4.401101786126856 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 111.07029777191241,
            "unit": "iter/sec",
            "range": "stddev: 0.0003926580308377022",
            "extra": "mean: 9.003307095237492 msec\nrounds: 42"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 103.91678697203021,
            "unit": "iter/sec",
            "range": "stddev: 0.01693971086030811",
            "extra": "mean: 9.623084288288819 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 160.20831312238533,
            "unit": "iter/sec",
            "range": "stddev: 0.00018441449438638943",
            "extra": "mean: 6.2418733492068315 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 140.730859303691,
            "unit": "iter/sec",
            "range": "stddev: 0.00018618365822152593",
            "extra": "mean: 7.105762054945205 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 42.38997787496327,
            "unit": "iter/sec",
            "range": "stddev: 0.00042178527877482504",
            "extra": "mean: 23.590481763158184 msec\nrounds: 38"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.9402821410493845,
            "unit": "iter/sec",
            "range": "stddev: 0.0074907079363958585",
            "extra": "mean: 144.08636128570964 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 18.34348380710116,
            "unit": "iter/sec",
            "range": "stddev: 0.0416365795139099",
            "extra": "mean: 54.51527150000146 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 31.213398772520968,
            "unit": "iter/sec",
            "range": "stddev: 0.0022341867111754727",
            "extra": "mean: 32.03752360605985 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 118.00820646209841,
            "unit": "iter/sec",
            "range": "stddev: 0.0004034411939985288",
            "extra": "mean: 8.473986936842206 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 160.01704276880218,
            "unit": "iter/sec",
            "range": "stddev: 0.01618765364253592",
            "extra": "mean: 6.2493343377482145 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 205.37331315079805,
            "unit": "iter/sec",
            "range": "stddev: 0.0001841100652812269",
            "extra": "mean: 4.869181806818965 msec\nrounds: 88"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 171.6798972027405,
            "unit": "iter/sec",
            "range": "stddev: 0.0002533641470137091",
            "extra": "mean: 5.824793795275158 msec\nrounds: 127"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 86.44757607869403,
            "unit": "iter/sec",
            "range": "stddev: 0.0004843771649305034",
            "extra": "mean: 11.567704328571235 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 163.89468818935742,
            "unit": "iter/sec",
            "range": "stddev: 0.0009947535704783934",
            "extra": "mean: 6.101479010989299 msec\nrounds: 91"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 216.09433274482853,
            "unit": "iter/sec",
            "range": "stddev: 0.00036569537365887107",
            "extra": "mean: 4.62760863414606 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 165.5293632219223,
            "unit": "iter/sec",
            "range": "stddev: 0.0006807158926091407",
            "extra": "mean: 6.0412242307687585 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 141.59231403967436,
            "unit": "iter/sec",
            "range": "stddev: 0.0005298996703301552",
            "extra": "mean: 7.062530242424025 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 198.9600867876172,
            "unit": "iter/sec",
            "range": "stddev: 0.0006746389883484381",
            "extra": "mean: 5.02613371428343 msec\nrounds: 7"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6cc0d21b8c38bbd7ed811e99e130d21eab7d8989",
          "message": "Merge pull request #128 from stnkvcmls/claude/p2-1-implementation-n549gy\n\nImplement P2-1: injury-risk early warning that acts",
          "timestamp": "2026-07-06T20:40:24-07:00",
          "tree_id": "876c50bd551cff59aa481d274f3aca8b700bfd8d",
          "url": "https://github.com/stnkvcmls/running-coach/commit/6cc0d21b8c38bbd7ed811e99e130d21eab7d8989"
        },
        "date": 1783395683010,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 200.9661694220315,
            "unit": "iter/sec",
            "range": "stddev: 0.015574652080579723",
            "extra": "mean: 4.975961888888807 msec\nrounds: 45"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 82.85082089237834,
            "unit": "iter/sec",
            "range": "stddev: 0.00041661681168718857",
            "extra": "mean: 12.0698864444443 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 67.05003371519211,
            "unit": "iter/sec",
            "range": "stddev: 0.013211597361370453",
            "extra": "mean: 14.914235602739469 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 80.3149975880792,
            "unit": "iter/sec",
            "range": "stddev: 0.01316459958967075",
            "extra": "mean: 12.450974662650374 msec\nrounds: 83"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 76.31082504996564,
            "unit": "iter/sec",
            "range": "stddev: 0.002344004220857446",
            "extra": "mean: 13.104300724638152 msec\nrounds: 69"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 146.54721427375975,
            "unit": "iter/sec",
            "range": "stddev: 0.00029745981599067995",
            "extra": "mean: 6.82373939999934 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 181.95059692391857,
            "unit": "iter/sec",
            "range": "stddev: 0.0002924688630101018",
            "extra": "mean: 5.495997358107835 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.2673023300971,
            "unit": "iter/sec",
            "range": "stddev: 0.00013233217779532594",
            "extra": "mean: 5.0950921937986635 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 120.05262700835756,
            "unit": "iter/sec",
            "range": "stddev: 0.012586232102160918",
            "extra": "mean: 8.329680282051505 msec\nrounds: 117"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 188.87936618783687,
            "unit": "iter/sec",
            "range": "stddev: 0.00011449954401982903",
            "extra": "mean: 5.294384559748677 msec\nrounds: 159"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 289.0938713016387,
            "unit": "iter/sec",
            "range": "stddev: 0.00022026517603146412",
            "extra": "mean: 3.4590840528632523 msec\nrounds: 227"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 152.9744767002707,
            "unit": "iter/sec",
            "range": "stddev: 0.00010087703656788249",
            "extra": "mean: 6.537038214285523 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 185.69759794547417,
            "unit": "iter/sec",
            "range": "stddev: 0.010498673816276612",
            "extra": "mean: 5.385099274647737 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 266.96371595093586,
            "unit": "iter/sec",
            "range": "stddev: 0.00010169843010402604",
            "extra": "mean: 3.7458273924527847 msec\nrounds: 265"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 278.5937121105179,
            "unit": "iter/sec",
            "range": "stddev: 0.0001015839699804514",
            "extra": "mean: 3.589456461254591 msec\nrounds: 271"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 236.21800489957235,
            "unit": "iter/sec",
            "range": "stddev: 0.00014985846179193604",
            "extra": "mean: 4.233377554878377 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 116.01883711745728,
            "unit": "iter/sec",
            "range": "stddev: 0.00038189611041662837",
            "extra": "mean: 8.619289977778363 msec\nrounds: 45"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 134.85633259370158,
            "unit": "iter/sec",
            "range": "stddev: 0.00010764010081508537",
            "extra": "mean: 7.415298790697683 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 166.95406511697553,
            "unit": "iter/sec",
            "range": "stddev: 0.00026125297192311665",
            "extra": "mean: 5.9896714662165005 msec\nrounds: 148"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 146.30058618052342,
            "unit": "iter/sec",
            "range": "stddev: 0.00017843402832040239",
            "extra": "mean: 6.835242606383535 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 42.62079085766459,
            "unit": "iter/sec",
            "range": "stddev: 0.00033153899080553103",
            "extra": "mean: 23.46272745945933 msec\nrounds: 37"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.4220636057603375,
            "unit": "iter/sec",
            "range": "stddev: 0.051594834084428554",
            "extra": "mean: 155.71318837500138 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.882580241172402,
            "unit": "iter/sec",
            "range": "stddev: 0.030923152523382527",
            "extra": "mean: 50.29528300000129 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 34.272299057439504,
            "unit": "iter/sec",
            "range": "stddev: 0.0005831323840420674",
            "extra": "mean: 29.178083393939385 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 128.10947208148735,
            "unit": "iter/sec",
            "range": "stddev: 0.0003404370349252137",
            "extra": "mean: 7.805824063999921 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 213.52696189078,
            "unit": "iter/sec",
            "range": "stddev: 0.000180046278292535",
            "extra": "mean: 4.683249324324225 msec\nrounds: 185"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 212.20714213738447,
            "unit": "iter/sec",
            "range": "stddev: 0.00014313292346609333",
            "extra": "mean: 4.71237673684231 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.9694056956066,
            "unit": "iter/sec",
            "range": "stddev: 0.00012521588781336582",
            "extra": "mean: 5.618943301470417 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 101.85570083999502,
            "unit": "iter/sec",
            "range": "stddev: 0.00017515096956199262",
            "extra": "mean: 9.817810802469452 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 187.37376688427355,
            "unit": "iter/sec",
            "range": "stddev: 0.0003047739093957018",
            "extra": "mean: 5.33692638317734 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 182.42348777918036,
            "unit": "iter/sec",
            "range": "stddev: 0.011350329822314322",
            "extra": "mean: 5.481750251428577 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 171.8066811596912,
            "unit": "iter/sec",
            "range": "stddev: 0.0004840530511742919",
            "extra": "mean: 5.820495415254068 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 147.69067945010107,
            "unit": "iter/sec",
            "range": "stddev: 0.0003483056624923917",
            "extra": "mean: 6.770907979591637 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 205.0747034167405,
            "unit": "iter/sec",
            "range": "stddev: 0.000291060147497714",
            "extra": "mean: 4.876271833332169 msec\nrounds: 6"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e19dbc025b29990a86319ad94df573d55babc37b",
          "message": "Merge pull request #129 from stnkvcmls/claude/item-p1-2-implementation-ejifpt\n\nAdd conditions-aware race pacing (P1-2)",
          "timestamp": "2026-07-06T21:36:23-07:00",
          "tree_id": "af6a33533446bfccaf9e8afdc820b3185b9da6ea",
          "url": "https://github.com/stnkvcmls/running-coach/commit/e19dbc025b29990a86319ad94df573d55babc37b"
        },
        "date": 1783399039864,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 203.3828606496999,
            "unit": "iter/sec",
            "range": "stddev: 0.014851058052611357",
            "extra": "mean: 4.916835159096164 msec\nrounds: 44"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 84.95332480276532,
            "unit": "iter/sec",
            "range": "stddev: 0.00044348580989316173",
            "extra": "mean: 11.771169666657341 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 68.6964322279453,
            "unit": "iter/sec",
            "range": "stddev: 0.012105749164460649",
            "extra": "mean: 14.556796729731854 msec\nrounds: 74"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 82.87645263559972,
            "unit": "iter/sec",
            "range": "stddev: 0.011482224527146149",
            "extra": "mean: 12.066153511624222 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 80.18200264948675,
            "unit": "iter/sec",
            "range": "stddev: 0.0001830200418043308",
            "extra": "mean: 12.471626636359664 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 148.5419361215567,
            "unit": "iter/sec",
            "range": "stddev: 0.00025268816282621984",
            "extra": "mean: 6.7321056000082535 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 183.3252831597723,
            "unit": "iter/sec",
            "range": "stddev: 0.00008136503927361354",
            "extra": "mean: 5.454784974358809 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 196.69942302184907,
            "unit": "iter/sec",
            "range": "stddev: 0.00009284576484975139",
            "extra": "mean: 5.083898999993109 msec\nrounds: 129"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 124.55556136495267,
            "unit": "iter/sec",
            "range": "stddev: 0.009900489228331897",
            "extra": "mean: 8.02854556666451 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 187.33104506886585,
            "unit": "iter/sec",
            "range": "stddev: 0.00018884862627865595",
            "extra": "mean: 5.33814349689014 msec\nrounds: 161"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 287.34010841996314,
            "unit": "iter/sec",
            "range": "stddev: 0.00011600240667503262",
            "extra": "mean: 3.480196362070156 msec\nrounds: 232"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 153.03776598661858,
            "unit": "iter/sec",
            "range": "stddev: 0.00009530465167338266",
            "extra": "mean: 6.534334799995961 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 186.27187755789237,
            "unit": "iter/sec",
            "range": "stddev: 0.009781193117456344",
            "extra": "mean: 5.36849691488832 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 262.54552181109165,
            "unit": "iter/sec",
            "range": "stddev: 0.00011447185466258809",
            "extra": "mean: 3.8088632900755623 msec\nrounds: 262"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 275.13977552984295,
            "unit": "iter/sec",
            "range": "stddev: 0.00010568503711306653",
            "extra": "mean: 3.6345163038469344 msec\nrounds: 260"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 235.3023792328801,
            "unit": "iter/sec",
            "range": "stddev: 0.0001222791794594159",
            "extra": "mean: 4.249850780345465 msec\nrounds: 173"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 117.51147646441281,
            "unit": "iter/sec",
            "range": "stddev: 0.0003451352650106867",
            "extra": "mean: 8.509807127670975 msec\nrounds: 47"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 136.06197402711072,
            "unit": "iter/sec",
            "range": "stddev: 0.00009784756856552088",
            "extra": "mean: 7.349592030766416 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 168.62731055043722,
            "unit": "iter/sec",
            "range": "stddev: 0.00014213529276006976",
            "extra": "mean: 5.930237496736303 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 148.87137701448162,
            "unit": "iter/sec",
            "range": "stddev: 0.00012318233049236104",
            "extra": "mean: 6.717207968746901 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 42.74978265021651,
            "unit": "iter/sec",
            "range": "stddev: 0.00038830232204772566",
            "extra": "mean: 23.391931794884467 msec\nrounds: 39"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.350368002873542,
            "unit": "iter/sec",
            "range": "stddev: 0.046555122766287975",
            "extra": "mean: 157.4711889999918 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 20.541666367281547,
            "unit": "iter/sec",
            "range": "stddev: 0.02831497698436164",
            "extra": "mean: 48.68154229166066 msec\nrounds: 24"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.37278629550867,
            "unit": "iter/sec",
            "range": "stddev: 0.0009520516791462201",
            "extra": "mean: 30.89014306249993 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 128.78611790846062,
            "unit": "iter/sec",
            "range": "stddev: 0.00008086390464684419",
            "extra": "mean: 7.7648120483823115 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 214.03908932345473,
            "unit": "iter/sec",
            "range": "stddev: 0.00009671573968312393",
            "extra": "mean: 4.67204379891939 msec\nrounds: 184"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 208.4791301957485,
            "unit": "iter/sec",
            "range": "stddev: 0.00027346984459818906",
            "extra": "mean: 4.796643189469681 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 177.17347109034432,
            "unit": "iter/sec",
            "range": "stddev: 0.0002522881576858199",
            "extra": "mean: 5.64418585833361 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 104.56521474365144,
            "unit": "iter/sec",
            "range": "stddev: 0.00023283562049164464",
            "extra": "mean: 9.563409805560733 msec\nrounds: 72"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 188.831504493211,
            "unit": "iter/sec",
            "range": "stddev: 0.0001752107722548351",
            "extra": "mean: 5.295726487398466 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 227.92944354601173,
            "unit": "iter/sec",
            "range": "stddev: 0.0000944221137276059",
            "extra": "mean: 4.387322604936434 msec\nrounds: 162"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 186.49185244816343,
            "unit": "iter/sec",
            "range": "stddev: 0.00036291680287607716",
            "extra": "mean: 5.36216454967091 msec\nrounds: 151"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 156.03080546811245,
            "unit": "iter/sec",
            "range": "stddev: 0.0002275713294348081",
            "extra": "mean: 6.4089908207540915 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 212.14996872713212,
            "unit": "iter/sec",
            "range": "stddev: 0.00007400794294106606",
            "extra": "mean: 4.7136467000200355 msec\nrounds: 10"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "69f19ce7a249b755bb3007fe83a9e112daa0195a",
          "message": "Merge pull request #130 from stnkvcmls/claude/item-p1-3-97kbjt\n\nAdd pre-workout briefing (P1-3)",
          "timestamp": "2026-07-07T07:56:18-07:00",
          "tree_id": "0f4d7ba95632239536d483a3e96c482bda997807",
          "url": "https://github.com/stnkvcmls/running-coach/commit/69f19ce7a249b755bb3007fe83a9e112daa0195a"
        },
        "date": 1783436241029,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 318.23983909080954,
            "unit": "iter/sec",
            "range": "stddev: 0.0002743051096944213",
            "extra": "mean: 3.1422841428556985 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 72.97423145797275,
            "unit": "iter/sec",
            "range": "stddev: 0.0006530859343805189",
            "extra": "mean: 13.703467374999612 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 57.74356104793433,
            "unit": "iter/sec",
            "range": "stddev: 0.016189695140886348",
            "extra": "mean: 17.31794821538415 msec\nrounds: 65"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 80.9099185151413,
            "unit": "iter/sec",
            "range": "stddev: 0.0010301157214151473",
            "extra": "mean: 12.35942413924026 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 70.71093616012615,
            "unit": "iter/sec",
            "range": "stddev: 0.0004681265766778214",
            "extra": "mean: 14.142084015625 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 132.1948046965712,
            "unit": "iter/sec",
            "range": "stddev: 0.00035299562051401007",
            "extra": "mean: 7.564593800000807 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 140.21324443450806,
            "unit": "iter/sec",
            "range": "stddev: 0.010636475973388775",
            "extra": "mean: 7.1319938714283735 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 167.59005715675764,
            "unit": "iter/sec",
            "range": "stddev: 0.0003663847648501716",
            "extra": "mean: 5.966941099999962 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 122.06608302106969,
            "unit": "iter/sec",
            "range": "stddev: 0.00042270909845166024",
            "extra": "mean: 8.192283845360969 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 161.67765754988068,
            "unit": "iter/sec",
            "range": "stddev: 0.00035797124609937656",
            "extra": "mean: 6.185146514084549 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 266.0618734144948,
            "unit": "iter/sec",
            "range": "stddev: 0.00026923958895619664",
            "extra": "mean: 3.758524237864443 msec\nrounds: 206"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 117.73042946312455,
            "unit": "iter/sec",
            "range": "stddev: 0.012312813639886589",
            "extra": "mean: 8.493980736842715 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 202.6862371253923,
            "unit": "iter/sec",
            "range": "stddev: 0.00041855709518344263",
            "extra": "mean: 4.933734101449364 msec\nrounds: 138"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 235.82396837776938,
            "unit": "iter/sec",
            "range": "stddev: 0.00045751551143842034",
            "extra": "mean: 4.240451074074402 msec\nrounds: 216"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 245.24521791634257,
            "unit": "iter/sec",
            "range": "stddev: 0.0003907108115265963",
            "extra": "mean: 4.077551474790091 msec\nrounds: 238"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 205.09779029798906,
            "unit": "iter/sec",
            "range": "stddev: 0.000807488016556525",
            "extra": "mean: 4.875722934640534 msec\nrounds: 153"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 105.46427716113442,
            "unit": "iter/sec",
            "range": "stddev: 0.0003130859525723491",
            "extra": "mean: 9.48188359999986 msec\nrounds: 45"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 115.93737230520192,
            "unit": "iter/sec",
            "range": "stddev: 0.0005082699446047504",
            "extra": "mean: 8.625346427272197 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 144.67875797939536,
            "unit": "iter/sec",
            "range": "stddev: 0.00039600432946285835",
            "extra": "mean: 6.911864699186984 msec\nrounds: 123"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 128.77896693623865,
            "unit": "iter/sec",
            "range": "stddev: 0.0005552950037472892",
            "extra": "mean: 7.765243220930032 msec\nrounds: 86"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 38.91385424503281,
            "unit": "iter/sec",
            "range": "stddev: 0.0004931547177785851",
            "extra": "mean: 25.69778859999831 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.779263508513733,
            "unit": "iter/sec",
            "range": "stddev: 0.010162393127898533",
            "extra": "mean: 147.5086487999988 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 18.163653898874767,
            "unit": "iter/sec",
            "range": "stddev: 0.03394517623200084",
            "extra": "mean: 55.05500190476266 msec\nrounds: 21"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 30.275933469121426,
            "unit": "iter/sec",
            "range": "stddev: 0.0015312104543837744",
            "extra": "mean: 33.02953486206808 msec\nrounds: 29"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 112.4319656028762,
            "unit": "iter/sec",
            "range": "stddev: 0.0007629585927511655",
            "extra": "mean: 8.894267699028989 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 189.8951540517861,
            "unit": "iter/sec",
            "range": "stddev: 0.00047982127721499343",
            "extra": "mean: 5.266063818180905 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 192.53256293612762,
            "unit": "iter/sec",
            "range": "stddev: 0.0003419733130166195",
            "extra": "mean: 5.193926599999339 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 165.19319948422012,
            "unit": "iter/sec",
            "range": "stddev: 0.00032526253085381066",
            "extra": "mean: 6.0535179603172695 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 95.98067086693709,
            "unit": "iter/sec",
            "range": "stddev: 0.0004964651419212428",
            "extra": "mean: 10.418764434209374 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 174.12971602246284,
            "unit": "iter/sec",
            "range": "stddev: 0.0005594424421415802",
            "extra": "mean: 5.74284517796491 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 223.66123393988113,
            "unit": "iter/sec",
            "range": "stddev: 0.00020413027223160438",
            "extra": "mean: 4.471047496182527 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 181.674614633667,
            "unit": "iter/sec",
            "range": "stddev: 0.00043316207169216063",
            "extra": "mean: 5.504346339285891 msec\nrounds: 168"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 121.97898447383106,
            "unit": "iter/sec",
            "range": "stddev: 0.0023211628457814456",
            "extra": "mean: 8.198133508928633 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 123.45287925817811,
            "unit": "iter/sec",
            "range": "stddev: 0.002378490252902555",
            "extra": "mean: 8.100256599999511 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "75f384d9376a6be4e4262135dcc61c1cf91e32cd",
          "message": "Merge pull request #131 from stnkvcmls/claude/p2-2-implementation-4fdfuz\n\nAdd season-over-season performance curve comparison",
          "timestamp": "2026-07-07T18:41:22-07:00",
          "tree_id": "97301f515cb4509f504dab32be1ae85ffb874731",
          "url": "https://github.com/stnkvcmls/running-coach/commit/75f384d9376a6be4e4262135dcc61c1cf91e32cd"
        },
        "date": 1783474938391,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 352.62496176468784,
            "unit": "iter/sec",
            "range": "stddev: 0.0005026480017617635",
            "extra": "mean: 2.835874111111044 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 79.85108376197843,
            "unit": "iter/sec",
            "range": "stddev: 0.0005006538893189765",
            "extra": "mean: 12.523311555555317 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 63.73077365126859,
            "unit": "iter/sec",
            "range": "stddev: 0.012353827108466227",
            "extra": "mean: 15.691006757142897 msec\nrounds: 70"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 84.39944341143624,
            "unit": "iter/sec",
            "range": "stddev: 0.0006939067037554518",
            "extra": "mean: 11.848419368420844 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 75.13528589560681,
            "unit": "iter/sec",
            "range": "stddev: 0.0003959025048908052",
            "extra": "mean: 13.30932581250044 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 141.6524173778916,
            "unit": "iter/sec",
            "range": "stddev: 0.00032304030584529454",
            "extra": "mean: 7.059533599996826 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 155.40397213421355,
            "unit": "iter/sec",
            "range": "stddev: 0.009112480883582075",
            "extra": "mean: 6.434841955882294 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 188.39706998125848,
            "unit": "iter/sec",
            "range": "stddev: 0.0003211298953042556",
            "extra": "mean: 5.307938175999652 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 127.728245143169,
            "unit": "iter/sec",
            "range": "stddev: 0.00045089516824730263",
            "extra": "mean: 7.829121889830337 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 182.20194772180136,
            "unit": "iter/sec",
            "range": "stddev: 0.00029168596123853617",
            "extra": "mean: 5.4884155328946855 msec\nrounds: 152"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 289.99190364133676,
            "unit": "iter/sec",
            "range": "stddev: 0.00020944977529144767",
            "extra": "mean: 3.4483721353710766 msec\nrounds: 229"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 121.17481784649273,
            "unit": "iter/sec",
            "range": "stddev: 0.01059002552309572",
            "extra": "mean: 8.252539741935696 msec\nrounds: 124"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 214.75878997978475,
            "unit": "iter/sec",
            "range": "stddev: 0.00025972282770524196",
            "extra": "mean: 4.656386823999753 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 259.16948566357246,
            "unit": "iter/sec",
            "range": "stddev: 0.000687085477393602",
            "extra": "mean: 3.858478931034723 msec\nrounds: 261"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 279.6133965760818,
            "unit": "iter/sec",
            "range": "stddev: 0.00016471177493614648",
            "extra": "mean: 3.576366555555587 msec\nrounds: 243"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 224.10378311800508,
            "unit": "iter/sec",
            "range": "stddev: 0.0002848402142392986",
            "extra": "mean: 4.462218290502644 msec\nrounds: 179"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 105.44730267767586,
            "unit": "iter/sec",
            "range": "stddev: 0.0004288360658632304",
            "extra": "mean: 9.483409955556018 msec\nrounds: 45"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 116.27446282643167,
            "unit": "iter/sec",
            "range": "stddev: 0.0004428876813706691",
            "extra": "mean: 8.600340742857242 msec\nrounds: 105"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 152.67527874470667,
            "unit": "iter/sec",
            "range": "stddev: 0.0005272407992837915",
            "extra": "mean: 6.54984885714296 msec\nrounds: 133"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 135.27618994966474,
            "unit": "iter/sec",
            "range": "stddev: 0.00029546021937508856",
            "extra": "mean: 7.392283892472818 msec\nrounds: 93"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 44.02368840622948,
            "unit": "iter/sec",
            "range": "stddev: 0.00042498893224594716",
            "extra": "mean: 22.715043564103027 msec\nrounds: 39"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.651376744797536,
            "unit": "iter/sec",
            "range": "stddev: 0.0032089917235683784",
            "extra": "mean: 115.58853920000018 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.814955385650073,
            "unit": "iter/sec",
            "range": "stddev: 0.027885866335256197",
            "extra": "mean: 50.466931695652306 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 36.74765412163199,
            "unit": "iter/sec",
            "range": "stddev: 0.0008712470597823182",
            "extra": "mean: 27.212621428569964 msec\nrounds: 35"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 105.44918046980219,
            "unit": "iter/sec",
            "range": "stddev: 0.0007662556661994937",
            "extra": "mean: 9.483241079207565 msec\nrounds: 101"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 190.46538030614911,
            "unit": "iter/sec",
            "range": "stddev: 0.00034693830631363855",
            "extra": "mean: 5.2502979722227 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 198.18465836841298,
            "unit": "iter/sec",
            "range": "stddev: 0.00033273938869668814",
            "extra": "mean: 5.045799247190274 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 145.27562022727736,
            "unit": "iter/sec",
            "range": "stddev: 0.001267587380473298",
            "extra": "mean: 6.883467428571591 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 93.61154739626588,
            "unit": "iter/sec",
            "range": "stddev: 0.0004478172724133926",
            "extra": "mean: 10.682442794871369 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 164.05318174266029,
            "unit": "iter/sec",
            "range": "stddev: 0.00037456545619515304",
            "extra": "mean: 6.095584306122364 msec\nrounds: 98"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 225.71391559249454,
            "unit": "iter/sec",
            "range": "stddev: 0.00018645294176186176",
            "extra": "mean: 4.430387011695845 msec\nrounds: 171"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 158.66110455638253,
            "unit": "iter/sec",
            "range": "stddev: 0.0008397520250991714",
            "extra": "mean: 6.30274195301997 msec\nrounds: 149"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 126.45592710014526,
            "unit": "iter/sec",
            "range": "stddev: 0.00047065132437076825",
            "extra": "mean: 7.907893468750279 msec\nrounds: 96"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 186.70337171981822,
            "unit": "iter/sec",
            "range": "stddev: 0.0007354597648090739",
            "extra": "mean: 5.3560896666648246 msec\nrounds: 6"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "26a8dd935df83c273411a1dcc1a477907d34059c",
          "message": "Merge pull request #132 from stnkvcmls/claude/p2-3-implementation-sx0rmn\n\nP2-3: audit and fix multi-sport load accounting",
          "timestamp": "2026-07-08T12:29:23-07:00",
          "tree_id": "d10b967107d9ea53b9c25a137416630b866f1d41",
          "url": "https://github.com/stnkvcmls/running-coach/commit/26a8dd935df83c273411a1dcc1a477907d34059c"
        },
        "date": 1783539028075,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 384.45087727854025,
            "unit": "iter/sec",
            "range": "stddev: 0.00027193577612354857",
            "extra": "mean: 2.6011125454539816 msec\nrounds: 11"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 95.21745672840376,
            "unit": "iter/sec",
            "range": "stddev: 0.0006767043192491738",
            "extra": "mean: 10.502275888888512 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 65.17144362074058,
            "unit": "iter/sec",
            "range": "stddev: 0.014361450264195153",
            "extra": "mean: 15.34414376056193 msec\nrounds: 71"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 102.10975660754967,
            "unit": "iter/sec",
            "range": "stddev: 0.00026639516844899884",
            "extra": "mean: 9.793383445652669 msec\nrounds: 92"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 92.38468242209547,
            "unit": "iter/sec",
            "range": "stddev: 0.00029902695908555184",
            "extra": "mean: 10.824305217948467 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 160.61454465563546,
            "unit": "iter/sec",
            "range": "stddev: 0.00041840020247443195",
            "extra": "mean: 6.226086200001646 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 195.6793500953009,
            "unit": "iter/sec",
            "range": "stddev: 0.000190608364206038",
            "extra": "mean: 5.110401273884926 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 195.4569067478999,
            "unit": "iter/sec",
            "range": "stddev: 0.007335149311930407",
            "extra": "mean: 5.116217260563726 msec\nrounds: 142"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 156.4577319762821,
            "unit": "iter/sec",
            "range": "stddev: 0.00023683229231646674",
            "extra": "mean: 6.391502595420423 msec\nrounds: 131"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 210.1769764074291,
            "unit": "iter/sec",
            "range": "stddev: 0.00020986957766156193",
            "extra": "mean: 4.757895070588012 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 305.06072582556357,
            "unit": "iter/sec",
            "range": "stddev: 0.000161368147777756",
            "extra": "mean: 3.2780358641505654 msec\nrounds: 265"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 165.30965244584647,
            "unit": "iter/sec",
            "range": "stddev: 0.00019004509147669253",
            "extra": "mean: 6.049253538462242 msec\nrounds: 156"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 242.91325248992231,
            "unit": "iter/sec",
            "range": "stddev: 0.00020716004258864928",
            "extra": "mean: 4.116695938775456 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 256.94820726450587,
            "unit": "iter/sec",
            "range": "stddev: 0.005509390538104766",
            "extra": "mean: 3.8918348979589763 msec\nrounds: 294"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 290.02816859348457,
            "unit": "iter/sec",
            "range": "stddev: 0.00013057500600365554",
            "extra": "mean: 3.4479409529411646 msec\nrounds: 255"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 252.0923013273456,
            "unit": "iter/sec",
            "range": "stddev: 0.00016907560623442546",
            "extra": "mean: 3.9668010277770644 msec\nrounds: 180"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 138.73487116047937,
            "unit": "iter/sec",
            "range": "stddev: 0.00023164300947684795",
            "extra": "mean: 7.2079931428578305 msec\nrounds: 42"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 150.9817229571628,
            "unit": "iter/sec",
            "range": "stddev: 0.00019582192214634127",
            "extra": "mean: 6.623318242855954 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 189.03636797428555,
            "unit": "iter/sec",
            "range": "stddev: 0.00019249671181150794",
            "extra": "mean: 5.289987375000926 msec\nrounds: 160"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 164.3941999753569,
            "unit": "iter/sec",
            "range": "stddev: 0.00021720062361975224",
            "extra": "mean: 6.082939666666479 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 50.983609513429215,
            "unit": "iter/sec",
            "range": "stddev: 0.0005175080966821863",
            "extra": "mean: 19.614146772730898 msec\nrounds: 44"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.257058298574814,
            "unit": "iter/sec",
            "range": "stddev: 0.03588138417886034",
            "extra": "mean: 121.1085066666663 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 24.934797467084625,
            "unit": "iter/sec",
            "range": "stddev: 0.02080901161641682",
            "extra": "mean: 40.10459685185163 msec\nrounds: 27"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 41.27032066064889,
            "unit": "iter/sec",
            "range": "stddev: 0.0009601602005325096",
            "extra": "mean: 24.230487769228713 msec\nrounds: 39"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 142.48274044361617,
            "unit": "iter/sec",
            "range": "stddev: 0.00024022656981433532",
            "extra": "mean: 7.018393925373186 msec\nrounds: 134"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 223.43202040874124,
            "unit": "iter/sec",
            "range": "stddev: 0.00033008634740639396",
            "extra": "mean: 4.475634236178967 msec\nrounds: 199"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 220.6666844740281,
            "unit": "iter/sec",
            "range": "stddev: 0.00018787961110446654",
            "extra": "mean: 4.531721688679731 msec\nrounds: 106"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 189.17710102814289,
            "unit": "iter/sec",
            "range": "stddev: 0.00019557938012035322",
            "extra": "mean: 5.286052035712478 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 120.44522000271394,
            "unit": "iter/sec",
            "range": "stddev: 0.0002060666568555252",
            "extra": "mean: 8.302529564705576 msec\nrounds: 85"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 182.38898909641674,
            "unit": "iter/sec",
            "range": "stddev: 0.0017986135787909276",
            "extra": "mean: 5.482787118642165 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 237.03598139545497,
            "unit": "iter/sec",
            "range": "stddev: 0.0001712562966685184",
            "extra": "mean: 4.218768788235853 msec\nrounds: 170"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 179.55278774103465,
            "unit": "iter/sec",
            "range": "stddev: 0.0026054111244302055",
            "extra": "mean: 5.569392781816787 msec\nrounds: 165"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 73.8262745721841,
            "unit": "iter/sec",
            "range": "stddev: 0.018019903074564247",
            "extra": "mean: 13.545313044642983 msec\nrounds: 112"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 204.73452688095745,
            "unit": "iter/sec",
            "range": "stddev: 0.00019775724053452704",
            "extra": "mean: 4.884374000001712 msec\nrounds: 13"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "bb149eb2c9ea26105470eb34c37adecf6a1c2475",
          "message": "Merge pull request #133 from stnkvcmls/claude/p3-2-implementation-5q8735\n\nParallelize AI job worker with thread pool & per-job timeout",
          "timestamp": "2026-07-08T12:58:55-07:00",
          "tree_id": "469635279738ed593774aac9ad6061785fffc1a4",
          "url": "https://github.com/stnkvcmls/running-coach/commit/bb149eb2c9ea26105470eb34c37adecf6a1c2475"
        },
        "date": 1783540790235,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 337.60482207839397,
            "unit": "iter/sec",
            "range": "stddev: 0.0003362595172157445",
            "extra": "mean: 2.962042999989478 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 73.95999176508658,
            "unit": "iter/sec",
            "range": "stddev: 0.0006021723893682389",
            "extra": "mean: 13.520823571427952 msec\nrounds: 7"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 57.139009238705235,
            "unit": "iter/sec",
            "range": "stddev: 0.016677215085875774",
            "extra": "mean: 17.501178500004734 msec\nrounds: 60"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 78.61255013885888,
            "unit": "iter/sec",
            "range": "stddev: 0.014528028240962113",
            "extra": "mean: 12.720615197365174 msec\nrounds: 76"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 77.71572746315019,
            "unit": "iter/sec",
            "range": "stddev: 0.00028490356198735583",
            "extra": "mean: 12.867408343750775 msec\nrounds: 64"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 144.2741249927241,
            "unit": "iter/sec",
            "range": "stddev: 0.0002350143283316112",
            "extra": "mean: 6.931249799993111 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 180.9472122613392,
            "unit": "iter/sec",
            "range": "stddev: 0.00008997321634768605",
            "extra": "mean: 5.526473646666166 msec\nrounds: 150"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 188.4016448540037,
            "unit": "iter/sec",
            "range": "stddev: 0.0003249052560937915",
            "extra": "mean: 5.307809285714678 msec\nrounds: 126"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 132.95875868112836,
            "unit": "iter/sec",
            "range": "stddev: 0.0003998482670511018",
            "extra": "mean: 7.521129182608231 msec\nrounds: 115"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 186.49187083560156,
            "unit": "iter/sec",
            "range": "stddev: 0.00014126494582430418",
            "extra": "mean: 5.3621640209804715 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 290.4843380669676,
            "unit": "iter/sec",
            "range": "stddev: 0.00010309121517162767",
            "extra": "mean: 3.442526391111187 msec\nrounds: 225"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 131.7215798612436,
            "unit": "iter/sec",
            "range": "stddev: 0.011297703124073686",
            "extra": "mean: 7.591770468084324 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 220.46395350135953,
            "unit": "iter/sec",
            "range": "stddev: 0.00014136197398375447",
            "extra": "mean: 4.535888902100421 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 260.8798487741098,
            "unit": "iter/sec",
            "range": "stddev: 0.0001474060188551122",
            "extra": "mean: 3.833182228137055 msec\nrounds: 263"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 275.3899464768693,
            "unit": "iter/sec",
            "range": "stddev: 0.00010728062162313918",
            "extra": "mean: 3.631214620552579 msec\nrounds: 253"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 230.38347016443788,
            "unit": "iter/sec",
            "range": "stddev: 0.00018571435683947143",
            "extra": "mean: 4.340589189346973 msec\nrounds: 169"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 112.80628360945482,
            "unit": "iter/sec",
            "range": "stddev: 0.00022560068392386354",
            "extra": "mean: 8.864754409090253 msec\nrounds: 44"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 126.26344493439426,
            "unit": "iter/sec",
            "range": "stddev: 0.00036305550052907846",
            "extra": "mean: 7.919948648000172 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 149.15556563573003,
            "unit": "iter/sec",
            "range": "stddev: 0.000920944502562789",
            "extra": "mean: 6.704409558824074 msec\nrounds: 136"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 139.76267412775755,
            "unit": "iter/sec",
            "range": "stddev: 0.0004293522549024454",
            "extra": "mean: 7.154986166663472 msec\nrounds: 6"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 39.46389621227654,
            "unit": "iter/sec",
            "range": "stddev: 0.00043807210668134964",
            "extra": "mean: 25.339616611117005 msec\nrounds: 36"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 7.216308682265471,
            "unit": "iter/sec",
            "range": "stddev: 0.005653495641760937",
            "extra": "mean: 138.57500337500284 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.12137893947349,
            "unit": "iter/sec",
            "range": "stddev: 0.03391974461337575",
            "extra": "mean: 52.29748352173681 msec\nrounds: 23"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 32.156958292723616,
            "unit": "iter/sec",
            "range": "stddev: 0.0011848730359500582",
            "extra": "mean: 31.097468575760075 msec\nrounds: 33"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 126.65752868842489,
            "unit": "iter/sec",
            "range": "stddev: 0.0002527903416486575",
            "extra": "mean: 7.895306424776224 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 214.9770550701296,
            "unit": "iter/sec",
            "range": "stddev: 0.00011190685413770014",
            "extra": "mean: 4.651659218579308 msec\nrounds: 183"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 214.05442702881987,
            "unit": "iter/sec",
            "range": "stddev: 0.00016016218056243508",
            "extra": "mean: 4.671709031578972 msec\nrounds: 95"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 178.27220084967965,
            "unit": "iter/sec",
            "range": "stddev: 0.0001761292091970731",
            "extra": "mean: 5.6093995319169645 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 103.44170196354747,
            "unit": "iter/sec",
            "range": "stddev: 0.0002545196452955269",
            "extra": "mean: 9.667281000001305 msec\nrounds: 79"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 176.90635721402506,
            "unit": "iter/sec",
            "range": "stddev: 0.0009613619528956798",
            "extra": "mean: 5.652708109240974 msec\nrounds: 119"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 224.7961908970626,
            "unit": "iter/sec",
            "range": "stddev: 0.00033731603692202874",
            "extra": "mean: 4.448473953270473 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 184.33877695430377,
            "unit": "iter/sec",
            "range": "stddev: 0.0006338790277634255",
            "extra": "mean: 5.424794590277078 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 118.83584159448766,
            "unit": "iter/sec",
            "range": "stddev: 0.01770595303935027",
            "extra": "mean: 8.414969647056264 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.25307531873767,
            "unit": "iter/sec",
            "range": "stddev: 0.0001602597751277854",
            "extra": "mean: 4.756173000009767 msec\nrounds: 5"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9c3ea7ad2e73af3770496f12ebc9218587d677bf",
          "message": "Merge pull request #134 from stnkvcmls/claude/p3-3-implementation-aw167m\n\nAdd React Testing Library tests for adaptive coaching UI",
          "timestamp": "2026-07-08T23:49:21-07:00",
          "tree_id": "4678fe5bbfe7f7b2fcd512d101c084f0b0c0011f",
          "url": "https://github.com/stnkvcmls/running-coach/commit/9c3ea7ad2e73af3770496f12ebc9218587d677bf"
        },
        "date": 1783579817701,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 357.18795212173075,
            "unit": "iter/sec",
            "range": "stddev: 0.00025829434899216064",
            "extra": "mean: 2.799646500000641 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 79.70464884438333,
            "unit": "iter/sec",
            "range": "stddev: 0.0006420801030839295",
            "extra": "mean: 12.546319624999747 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 53.69375327045453,
            "unit": "iter/sec",
            "range": "stddev: 0.020965735945784377",
            "extra": "mean: 18.624140409090362 msec\nrounds: 66"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 81.92026963471368,
            "unit": "iter/sec",
            "range": "stddev: 0.013001531652605487",
            "extra": "mean: 12.206991071428927 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 79.5709436425291,
            "unit": "iter/sec",
            "range": "stddev: 0.0002186594390043923",
            "extra": "mean: 12.567401544117415 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 150.8802110101902,
            "unit": "iter/sec",
            "range": "stddev: 0.0002877461438388923",
            "extra": "mean: 6.627774400000419 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 187.200430498983,
            "unit": "iter/sec",
            "range": "stddev: 0.00008635570559485168",
            "extra": "mean: 5.341868057324969 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 195.02202322863744,
            "unit": "iter/sec",
            "range": "stddev: 0.0001406667092367074",
            "extra": "mean: 5.127626015999397 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 140.1075182863533,
            "unit": "iter/sec",
            "range": "stddev: 0.00009550011299420875",
            "extra": "mean: 7.137375725663693 msec\nrounds: 113"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 185.47528073175778,
            "unit": "iter/sec",
            "range": "stddev: 0.00014064904353507416",
            "extra": "mean: 5.391554044585825 msec\nrounds: 157"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 301.61262443151406,
            "unit": "iter/sec",
            "range": "stddev: 0.0001036467213017256",
            "extra": "mean: 3.315511086065517 msec\nrounds: 244"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 133.38980317581323,
            "unit": "iter/sec",
            "range": "stddev: 0.011914325999162796",
            "extra": "mean: 7.49682491608417 msec\nrounds: 143"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 232.92725319380472,
            "unit": "iter/sec",
            "range": "stddev: 0.000135374874148196",
            "extra": "mean: 4.293185903703421 msec\nrounds: 135"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 277.9841578496562,
            "unit": "iter/sec",
            "range": "stddev: 0.00012584188016450594",
            "extra": "mean: 3.5973272999997215 msec\nrounds: 280"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 282.1949699684033,
            "unit": "iter/sec",
            "range": "stddev: 0.0003844930466328596",
            "extra": "mean: 3.543649272387696 msec\nrounds: 268"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 244.70794632580115,
            "unit": "iter/sec",
            "range": "stddev: 0.0001045261279103133",
            "extra": "mean: 4.086503993902234 msec\nrounds: 164"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 111.8814394077134,
            "unit": "iter/sec",
            "range": "stddev: 0.00017277628687913612",
            "extra": "mean: 8.938033022223143 msec\nrounds: 45"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 113.94169703449381,
            "unit": "iter/sec",
            "range": "stddev: 0.013814925881889399",
            "extra": "mean: 8.776418343999808 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 164.29407782407486,
            "unit": "iter/sec",
            "range": "stddev: 0.00011684136366325576",
            "extra": "mean: 6.0866466597219295 msec\nrounds: 144"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 145.43244219876667,
            "unit": "iter/sec",
            "range": "stddev: 0.00023123524546539298",
            "extra": "mean: 6.876044882979215 msec\nrounds: 94"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 34.783501232733826,
            "unit": "iter/sec",
            "range": "stddev: 0.0009074282339634423",
            "extra": "mean: 28.749262281248633 msec\nrounds: 32"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 8.749228952325673,
            "unit": "iter/sec",
            "range": "stddev: 0.004576057029832704",
            "extra": "mean: 114.29578599999779 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 22.907887886780532,
            "unit": "iter/sec",
            "range": "stddev: 0.0005555121978502294",
            "extra": "mean: 43.653086000000485 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 40.079898837453584,
            "unit": "iter/sec",
            "range": "stddev: 0.0010587027383935133",
            "extra": "mean: 24.950162774999995 msec\nrounds: 40"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 129.19862374813763,
            "unit": "iter/sec",
            "range": "stddev: 0.00009058101087665462",
            "extra": "mean: 7.740020528000514 msec\nrounds: 125"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 219.198793620322,
            "unit": "iter/sec",
            "range": "stddev: 0.00014758323032564813",
            "extra": "mean: 4.5620689032263435 msec\nrounds: 186"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 216.15371756098708,
            "unit": "iter/sec",
            "range": "stddev: 0.00012865238538010948",
            "extra": "mean: 4.626337271843836 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 181.92192305871848,
            "unit": "iter/sec",
            "range": "stddev: 0.0001287220674390956",
            "extra": "mean: 5.4968636170212015 msec\nrounds: 141"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 99.56900611075734,
            "unit": "iter/sec",
            "range": "stddev: 0.00019905044842913498",
            "extra": "mean: 10.043285948718141 msec\nrounds: 78"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 152.11050415403025,
            "unit": "iter/sec",
            "range": "stddev: 0.01600754051222173",
            "extra": "mean: 6.574167941665484 msec\nrounds: 120"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 232.13754246561442,
            "unit": "iter/sec",
            "range": "stddev: 0.00015743806789249317",
            "extra": "mean: 4.307790930233208 msec\nrounds: 172"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 191.08165572259531,
            "unit": "iter/sec",
            "range": "stddev: 0.0003308389249177114",
            "extra": "mean: 5.233364742514896 msec\nrounds: 167"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 158.55444837016515,
            "unit": "iter/sec",
            "range": "stddev: 0.000181905779054604",
            "extra": "mean: 6.306981672727184 msec\nrounds: 110"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 210.24086770604416,
            "unit": "iter/sec",
            "range": "stddev: 0.00011919012260572728",
            "extra": "mean: 4.756449166668138 msec\nrounds: 6"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "stnkvcmls@gmail.com",
            "name": "stnkvcmls",
            "username": "stnkvcmls"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4dae56c2d049d921069008387c42b1efdd12ce06",
          "message": "Merge pull request #135 from stnkvcmls/claude/failing-tests-main-7i8wu9\n\nFix test DB isolation by switching from in-memory to file-backed SQLite",
          "timestamp": "2026-07-09T08:10:24-07:00",
          "tree_id": "4ab059993a8434f1e8be6f3706d502135de40cc5",
          "url": "https://github.com/stnkvcmls/running-coach/commit/4dae56c2d049d921069008387c42b1efdd12ce06"
        },
        "date": 1783609885232,
        "tool": "pytest",
        "benches": [
          {
            "name": "perf/test_perf_endpoints.py::test_me",
            "value": 308.0878398139379,
            "unit": "iter/sec",
            "range": "stddev: 0.0005856244441781841",
            "extra": "mean: 3.2458275555566414 msec\nrounds: 9"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_today",
            "value": 63.000306598867766,
            "unit": "iter/sec",
            "range": "stddev: 0.001311555841234465",
            "extra": "mean: 15.872938624999833 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_training_load",
            "value": 51.47009873951696,
            "unit": "iter/sec",
            "range": "stddev: 0.015383625968913598",
            "extra": "mean: 19.428756199999953 msec\nrounds: 55"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_wellness_trends",
            "value": 71.05934768377034,
            "unit": "iter/sec",
            "range": "stddev: 0.013383314992483375",
            "extra": "mean: 14.072743876713012 msec\nrounds: 73"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activities_list",
            "value": 71.98424466440262,
            "unit": "iter/sec",
            "range": "stddev: 0.0003277649740227325",
            "extra": "mean: 13.891928777777622 msec\nrounds: 63"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_activity_detail",
            "value": 125.30329348926493,
            "unit": "iter/sec",
            "range": "stddev: 0.00029434281680697385",
            "extra": "mean: 7.9806362000027775 msec\nrounds: 5"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summaries_list",
            "value": 125.3641255125992,
            "unit": "iter/sec",
            "range": "stddev: 0.012320393417995163",
            "extra": "mean: 7.976763654762615 msec\nrounds: 84"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_daily_summary_detail",
            "value": 164.18105240575053,
            "unit": "iter/sec",
            "range": "stddev: 0.0010068260354713788",
            "extra": "mean: 6.090836825242415 msec\nrounds: 103"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_month",
            "value": 119.67691095024142,
            "unit": "iter/sec",
            "range": "stddev: 0.000883915888786211",
            "extra": "mean: 8.355830644858257 msec\nrounds: 107"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_week",
            "value": 156.12799485876522,
            "unit": "iter/sec",
            "range": "stddev: 0.0005911850676290435",
            "extra": "mean: 6.405001235714382 msec\nrounds: 140"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_calendar_event_detail",
            "value": 246.04756483260334,
            "unit": "iter/sec",
            "range": "stddev: 0.0009018786192746674",
            "extra": "mean: 4.06425481463449 msec\nrounds: 205"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_insights",
            "value": 121.46863152977254,
            "unit": "iter/sec",
            "range": "stddev: 0.0013300542689861185",
            "extra": "mean: 8.232578134832245 msec\nrounds: 89"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_settings",
            "value": 190.54487921383674,
            "unit": "iter/sec",
            "range": "stddev: 0.0006973494837569144",
            "extra": "mean: 5.248107449152501 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_ai_config",
            "value": 184.55812160822313,
            "unit": "iter/sec",
            "range": "stddev: 0.008933599843366452",
            "extra": "mean: 5.418347300493138 msec\nrounds: 203"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_athlete_profile",
            "value": 257.04218246990104,
            "unit": "iter/sec",
            "range": "stddev: 0.0004395171418514482",
            "extra": "mean: 3.890412034285841 msec\nrounds: 175"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_zones",
            "value": 209.47597262167596,
            "unit": "iter/sec",
            "range": "stddev: 0.0003637701148907863",
            "extra": "mean: 4.773817194805678 msec\nrounds: 154"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_threshold_estimate",
            "value": 103.17223313495815,
            "unit": "iter/sec",
            "range": "stddev: 0.000532622541203712",
            "extra": "mean: 9.692530340909787 msec\nrounds: 44"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_performance_curve",
            "value": 111.9642603947942,
            "unit": "iter/sec",
            "range": "stddev: 0.0005449429199659984",
            "extra": "mean: 8.931421477477961 msec\nrounds: 111"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_intensity_trends",
            "value": 135.17691675346683,
            "unit": "iter/sec",
            "range": "stddev: 0.0017723263369269617",
            "extra": "mean: 7.397712745762516 msec\nrounds: 118"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_training_plan",
            "value": 117.92973597241219,
            "unit": "iter/sec",
            "range": "stddev: 0.0006973484470029478",
            "extra": "mean: 8.479625530866398 msec\nrounds: 81"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_get_realignment_status",
            "value": 38.68071010347825,
            "unit": "iter/sec",
            "range": "stddev: 0.0018587098408057359",
            "extra": "mean: 25.852679470589084 msec\nrounds: 34"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_csv",
            "value": 6.999825734963203,
            "unit": "iter/sec",
            "range": "stddev: 0.050873516022402886",
            "extra": "mean: 142.8606993750048 msec\nrounds: 8"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_activities_json",
            "value": 19.318130918499254,
            "unit": "iter/sec",
            "range": "stddev: 0.028527494838084352",
            "extra": "mean: 51.76484227272675 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_csv",
            "value": 35.26242764275755,
            "unit": "iter/sec",
            "range": "stddev: 0.0014904215825372181",
            "extra": "mean: 28.35879622727527 msec\nrounds: 22"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_export_insights_json",
            "value": 104.26931851616999,
            "unit": "iter/sec",
            "range": "stddev: 0.0006257433140422397",
            "extra": "mean: 9.590548919190653 msec\nrounds: 99"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_ai_config",
            "value": 168.69841200408098,
            "unit": "iter/sec",
            "range": "stddev: 0.0007526703891635914",
            "extra": "mean: 5.927738074830301 msec\nrounds: 147"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_set_athlete_profile",
            "value": 172.24507007565262,
            "unit": "iter/sec",
            "range": "stddev: 0.0004286677373625238",
            "extra": "mean: 5.805681402438891 msec\nrounds: 82"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_update_zones",
            "value": 148.82395546024063,
            "unit": "iter/sec",
            "range": "stddev: 0.000743424575085945",
            "extra": "mean: 6.719348352941454 msec\nrounds: 102"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_apply_threshold_estimate",
            "value": 86.49797484772583,
            "unit": "iter/sec",
            "range": "stddev: 0.0009474388554241714",
            "extra": "mean: 11.560964308822678 msec\nrounds: 68"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_generate_training_plan",
            "value": 151.89782703221687,
            "unit": "iter/sec",
            "range": "stddev: 0.000869507037016741",
            "extra": "mean: 6.583372649484343 msec\nrounds: 97"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_realignment_dismiss",
            "value": 198.52806269075418,
            "unit": "iter/sec",
            "range": "stddev: 0.0006033542918235591",
            "extra": "mean: 5.037071265626025 msec\nrounds: 128"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_analysis",
            "value": 152.24488163861878,
            "unit": "iter/sec",
            "range": "stddev: 0.0005799892266760724",
            "extra": "mean: 6.568365315385012 msec\nrounds: 130"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_submit_feedback",
            "value": 121.02496087781428,
            "unit": "iter/sec",
            "range": "stddev: 0.0010606308978278192",
            "extra": "mean: 8.26275829999723 msec\nrounds: 80"
          },
          {
            "name": "perf/test_perf_endpoints.py::test_trigger_sync",
            "value": 160.3739994981388,
            "unit": "iter/sec",
            "range": "stddev: 0.000978682342423608",
            "extra": "mean: 6.235424714288586 msec\nrounds: 7"
          }
        ]
      }
    ]
  }
}