window.BENCHMARK_DATA = {
  "lastUpdate": 1782024395214,
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
      }
    ]
  }
}