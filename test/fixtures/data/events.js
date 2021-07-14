export default [
  {
    "type": "timelog.timelog_event",
    "body": {
      "event_type": "vessel_arrived",
      "sender": 2,
      "job_order": 13,
      "timestamp": new Date("2018-01-22T12:30:00.000Z")
    }
  },
  {
    "type": "timelog.timelog_event",
    "body": {
      "event_type": "nor_tendered",
      "sender": 1,
      "job_order": 13,
      "timestamp": new Date("2018-01-22T21:30:00.000Z")
    }
  },
  {
    "type": "timelog.timelog_event",
    "body": {
      "event_type": "nor_accepted",
      "sender": 2,
      "job_order": 13,
      "timestamp": new Date("2018-01-22T23:30:00.000Z")
    }
  },
  {
    "type": "timelog.timelog_event",
    "body": {
      "event_type": "hoses_connected",
      "sender": 3,
      "job_order": 13,
      "timestamp": new Date("2018-01-12T21:29:00.000Z")
    }
  },
  {
    "type": "timelog.timelog_event",
    "body": {
      "event_type": "commenced_loading",
      "sender": 1,
      "job_order": 13,
      "timestamp": new Date("2018-01-22T21:30:00.000Z")
    }
  }
]

