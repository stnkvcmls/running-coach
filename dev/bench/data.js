window.BENCHMARK_DATA = {
  "lastUpdate": 1781953500640,
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
      }
    ]
  }
}