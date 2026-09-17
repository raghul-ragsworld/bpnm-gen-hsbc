from pathlib import Path
import xml.etree.ElementTree as ET


ROOT = Path(__file__).parent
BPMN = "http://www.omg.org/spec/BPMN/20100524/MODEL"
BPMNDI = "http://www.omg.org/spec/BPMN/20100524/DI"
DC = "http://www.omg.org/spec/DD/20100524/DC"
DI = "http://www.omg.org/spec/DD/20100524/DI"
BIOC = "http://bpmn.io/schema/bpmn/biocolor/1.0"
XSI = "http://www.w3.org/2001/XMLSchema-instance"

NS = {"bpmn": BPMN, "bpmndi": BPMNDI, "dc": DC, "di": DI}
for prefix, uri in {**NS, "bioc": BIOC, "xsi": XSI}.items():
    ET.register_namespace(prefix, uri)

NODE_TAGS = {
    "startEvent",
    "endEvent",
    "intermediateCatchEvent",
    "userTask",
    "manualTask",
    "serviceTask",
    "scriptTask",
    "exclusiveGateway",
    "eventBasedGateway",
    "parallelGateway",
}

APPROVAL_EVENTS = [
    "Event_ApprovalApproved",
    "Event_ApprovalRejected",
    "Event_ApprovalWithdrawn",
    "Event_ApprovalTimeout",
]
TECHNICAL_NODES = ["Gateway_IngestionStatus", "Gateway_RetryAllowed", "End_ParkedTechnical"]
REMEDIATION_NODES = [
    "Gateway_SpecialistOutcome",
    "Gateway_RemediationAttempts",
    "Task_RemediationEscalation",
    "End_ParkedRemediation",
    "Gateway_CheckerOutcome",
]
PUBLISH_NODES = ["Gateway_PublishSplit", "Gateway_PublishJoin"]

LANE_ASSIGNMENTS = {
    "diagram1_process_technology.bpmn": {
        "Lane_1": [
            "StartEvent_1",
            *[f"Task_AOB_{number:03d}" for number in range(1, 7)],
            *APPROVAL_EVENTS,
            "Task_ApprovalEscalation",
            "End_Withdrawn",
        ],
        "Lane_2": ["Task_AOB_007"],
        "Lane_3": [
            *[f"Task_AOB_{number:03d}" for number in range(8, 30)],
            *TECHNICAL_NODES,
            *REMEDIATION_NODES,
            *PUBLISH_NODES,
            "EndEvent_1",
        ],
    },
    "diagram2_process_people.bpmn": {
        "Lane_P1": ["StartEvent_1", "Task_AOB_001", "Task_AOB_004", "End_Withdrawn"],
        "Lane_P2": [
            "Task_AOB_002", "Task_AOB_003", "Task_AOB_007", "Task_AOB_019", "Task_AOB_020", "Task_AOB_029",
            *REMEDIATION_NODES[1:],
        ],
        "Lane_P3": ["Task_AOB_005", "Task_AOB_006", *APPROVAL_EVENTS, "Task_ApprovalEscalation"],
        "Lane_P4": [
            *[f"Task_AOB_{number:03d}" for number in range(8, 19)],
            *[f"Task_AOB_{number:03d}" for number in range(21, 29)],
            *TECHNICAL_NODES,
            "Gateway_SpecialistOutcome",
            *PUBLISH_NODES,
            "EndEvent_1",
        ],
    },
    "diagram3_people_process_technology.bpmn": {
        "Lane_C1": ["StartEvent_1", "Task_AOB_001", "Task_AOB_004", "End_Withdrawn"],
        "Lane_C2": ["Task_AOB_002", "Task_AOB_003", "Task_AOB_007"],
        "Lane_C3": ["Task_AOB_005", "Task_AOB_006", *APPROVAL_EVENTS, "Task_ApprovalEscalation"],
        "Lane_C4": [
            *[f"Task_AOB_{number:03d}" for number in range(8, 16)],
            "Task_AOB_018",
            *[f"Task_AOB_{number:03d}" for number in range(21, 29)],
            *TECHNICAL_NODES,
            *PUBLISH_NODES,
            "EndEvent_1",
        ],
        "Lane_C5": [
            "Task_AOB_016", "Task_AOB_017", "Task_AOB_019", "Task_AOB_020", "Task_AOB_029",
            *REMEDIATION_NODES,
        ],
    },
}

AUXILIARY_NODES = [
    ("intermediateCatchEvent", "Event_ApprovalApproved", "Approval received"),
    ("intermediateCatchEvent", "Event_ApprovalRejected", "Rejection received"),
    ("intermediateCatchEvent", "Event_ApprovalWithdrawn", "Withdrawal received"),
    ("intermediateCatchEvent", "Event_ApprovalTimeout", "24-hour timeout"),
    ("serviceTask", "Task_ApprovalEscalation", "Escalate approval timeout"),
    ("exclusiveGateway", "Gateway_IngestionStatus", "Ingestion successful?"),
    ("exclusiveGateway", "Gateway_RetryAllowed", "Retry available?"),
    ("exclusiveGateway", "Gateway_SpecialistOutcome", "Specialist approved?"),
    ("exclusiveGateway", "Gateway_RemediationAttempts", "Remediation attempts available?"),
    ("serviceTask", "Task_RemediationEscalation", "Escalate remediation breach"),
    ("exclusiveGateway", "Gateway_CheckerOutcome", "Checker approved?"),
    ("parallelGateway", "Gateway_PublishSplit", "Publish to consumers"),
    ("parallelGateway", "Gateway_PublishJoin", "Consumer publishing complete"),
    ("endEvent", "End_Withdrawn", "Request withdrawn"),
    ("endEvent", "End_ParkedTechnical", "Parked - Technical"),
    ("endEvent", "End_ParkedRemediation", "Parked - Remediation"),
]

FLOW_SPECS = [
    ("StartEvent_1", "Task_AOB_001", "", ""),
    ("Task_AOB_001", "Task_AOB_002", "", ""),
    ("Task_AOB_002", "Task_AOB_003", "", ""),
    ("Task_AOB_003", "Task_AOB_004", "Incomplete", "Mandatory data or supporting evidence is missing"),
    ("Task_AOB_003", "Task_AOB_005", "Complete", "All mandatory data and supporting evidence are present"),
    ("Task_AOB_004", "Task_AOB_001", "Correct and resubmit", ""),
    ("Task_AOB_005", "Task_AOB_006", "Await outcome", ""),
    ("Task_AOB_006", "Event_ApprovalApproved", "Approve", ""),
    ("Task_AOB_006", "Event_ApprovalRejected", "Reject", ""),
    ("Task_AOB_006", "Event_ApprovalWithdrawn", "Withdraw", ""),
    ("Task_AOB_006", "Event_ApprovalTimeout", "Timeout", ""),
    ("Event_ApprovalApproved", "Task_AOB_007", "", ""),
    ("Event_ApprovalRejected", "Task_AOB_004", "Return for correction", ""),
    ("Event_ApprovalWithdrawn", "End_Withdrawn", "", ""),
    ("Event_ApprovalTimeout", "Task_ApprovalEscalation", "", ""),
    ("Task_ApprovalEscalation", "Task_AOB_006", "Continue waiting", ""),
    ("Task_AOB_007", "Task_AOB_008", "", ""),
    ("Task_AOB_008", "Task_AOB_009", "", ""),
    ("Task_AOB_009", "Gateway_IngestionStatus", "", ""),
    ("Gateway_IngestionStatus", "Task_AOB_011", "Success", "Schema validation status is PASS"),
    ("Gateway_IngestionStatus", "Task_AOB_010", "Failure", "Schema validation status is FAIL"),
    ("Task_AOB_010", "Gateway_RetryAllowed", "", ""),
    ("Gateway_RetryAllowed", "Task_AOB_009", "Retry", "Retry count is less than 2"),
    ("Gateway_RetryAllowed", "End_ParkedTechnical", "Retries exhausted", "Retry count is at least 2"),
    ("Task_AOB_011", "Task_AOB_012", "DQ validation", ""),
    ("Task_AOB_011", "Task_AOB_013", "Reference enrichment", ""),
    ("Task_AOB_011", "Task_AOB_014", "Duplicate detection", ""),
    ("Task_AOB_012", "Task_AOB_015", "", ""),
    ("Task_AOB_013", "Task_AOB_015", "", ""),
    ("Task_AOB_014", "Task_AOB_015", "", ""),
    ("Task_AOB_015", "Task_AOB_016", "", ""),
    ("Task_AOB_016", "Task_AOB_017", "Review required", "Tax review basis is true"),
    ("Task_AOB_016", "Task_AOB_018", "No review required", "Tax review basis is false"),
    ("Task_AOB_017", "Gateway_SpecialistOutcome", "", ""),
    ("Gateway_SpecialistOutcome", "Task_AOB_018", "Approved", "Specialist review outcome is approved"),
    ("Gateway_SpecialistOutcome", "Task_AOB_019", "Correction required", "Specialist review requires correction"),
    ("Task_AOB_018", "Task_AOB_020", "Pass", "DQ, merge, and specialist outcomes pass"),
    ("Task_AOB_018", "Task_AOB_019", "Fail", "DQ, merge, or specialist outcome requires remediation"),
    ("Task_AOB_019", "Gateway_RemediationAttempts", "", ""),
    ("Gateway_RemediationAttempts", "Task_AOB_011", "Revalidate", "Remediation attempt count is at most 3"),
    ("Gateway_RemediationAttempts", "Task_RemediationEscalation", "Limit exceeded", "Remediation attempt count exceeds 3"),
    ("Task_RemediationEscalation", "End_ParkedRemediation", "Park case", ""),
    ("Task_AOB_020", "Gateway_CheckerOutcome", "", ""),
    ("Gateway_CheckerOutcome", "Task_AOB_021", "Approved", "Checker outcome is approved"),
    ("Gateway_CheckerOutcome", "Task_AOB_019", "Rejected", "Checker outcome is rejected"),
    ("Task_AOB_021", "Task_AOB_022", "", ""),
    ("Task_AOB_022", "Task_AOB_023", "", ""),
    ("Task_AOB_023", "Gateway_PublishSplit", "", ""),
    ("Gateway_PublishSplit", "Task_AOB_024", "DDT", ""),
    ("Gateway_PublishSplit", "Task_AOB_025", "Portfolio analytics", ""),
    ("Gateway_PublishSplit", "Task_AOB_026", "Client reporting", ""),
    ("Task_AOB_024", "Gateway_PublishJoin", "", ""),
    ("Task_AOB_025", "Gateway_PublishJoin", "", ""),
    ("Task_AOB_026", "Gateway_PublishJoin", "", ""),
    ("Gateway_PublishJoin", "Task_AOB_027", "", ""),
    ("Task_AOB_027", "Task_AOB_028", "", ""),
    ("Task_AOB_028", "Task_AOB_029", "", ""),
    ("Task_AOB_029", "EndEvent_1", "", ""),
]

DOCUMENTATION = {
    "Task_AOB_002": "Set routing category, urgency, SLA target, and assigned maker.",
    "Task_AOB_003": "Missing mandatory attributes or evidence routes to clarification; complete requests route to approval.",
    "Task_AOB_006": "Wait for approve, reject, withdraw, or a 24-hour timeout.",
    "Task_AOB_010": "Create a ServiceNow incident, retry no more than twice, then park the case.",
    "Task_AOB_011": "Run data quality, reference enrichment, and duplicate detection concurrently.",
    "Task_AOB_015": "Wait for all three validation branches and consolidate their outputs.",
    "Task_AOB_016": "Require specialist review when the tax review basis is true.",
    "Task_AOB_018": "Pass only when DQ, merge, and any required specialist review are acceptable.",
    "Task_AOB_019": "Apply corrections and revalidate, with a maximum of three remediation attempts.",
    "Task_AOB_020": "Publish only after independent checker approval; rejection returns to remediation.",
}

COLORS = {
    "startEvent": ("#D5E8D4", "#2D7600"),
    "endEvent": ("#F8CECC", "#B85450"),
    "intermediateCatchEvent": ("#FFF2CC", "#D6B656"),
    "userTask": ("#DAE8FC", "#6C8EBF"),
    "manualTask": ("#FFF2CC", "#D6B656"),
    "serviceTask": ("#D5E8D4", "#82B366"),
    "scriptTask": ("#E1D5E7", "#9673A6"),
    "exclusiveGateway": ("#FFE6CC", "#D79B00"),
    "eventBasedGateway": ("#FFE6CC", "#D79B00"),
    "parallelGateway": ("#FFE6CC", "#D79B00"),
}

COLUMN_WIDTH = 220
LANE_HEIGHT = 420

NODE_COLUMNS = {
    "StartEvent_1": 0,
    **{f"Task_AOB_{number:03d}": number for number in range(1, 30)},
    "Task_AOB_004": 3,
    "Task_AOB_005": 4,
    "Task_AOB_006": 5,
    "Event_ApprovalApproved": 6,
    "Event_ApprovalRejected": 6,
    "Event_ApprovalWithdrawn": 6,
    "Event_ApprovalTimeout": 6,
    "Task_ApprovalEscalation": 7,
    "End_Withdrawn": 7,
    "Task_AOB_007": 7,
    "Task_AOB_008": 8,
    "Task_AOB_009": 9,
    "Gateway_IngestionStatus": 10,
    "Task_AOB_010": 11,
    "Gateway_RetryAllowed": 12,
    "End_ParkedTechnical": 13,
    "Task_AOB_011": 11,
    "Task_AOB_012": 12,
    "Task_AOB_013": 12,
    "Task_AOB_014": 12,
    "Task_AOB_015": 13,
    "Task_AOB_016": 14,
    "Task_AOB_017": 15,
    "Gateway_SpecialistOutcome": 16,
    "Task_AOB_018": 17,
    "Task_AOB_019": 18,
    "Gateway_RemediationAttempts": 19,
    "Task_RemediationEscalation": 20,
    "End_ParkedRemediation": 21,
    "Task_AOB_020": 19,
    "Gateway_CheckerOutcome": 20,
    "Task_AOB_021": 21,
    "Task_AOB_022": 22,
    "Task_AOB_023": 23,
    "Gateway_PublishSplit": 24,
    "Task_AOB_024": 25,
    "Task_AOB_025": 25,
    "Task_AOB_026": 25,
    "Gateway_PublishJoin": 26,
    "Task_AOB_027": 27,
    "Task_AOB_028": 28,
    "Task_AOB_029": 29,
    "EndEvent_1": 30,
}

NODE_TRACKS = {
    "Task_AOB_004": 1.4,
    "Event_ApprovalApproved": -1.5,
    "Event_ApprovalRejected": -0.5,
    "Event_ApprovalWithdrawn": 0.5,
    "Event_ApprovalTimeout": 1.5,
    "Task_AOB_007": -1.3,
    "Task_ApprovalEscalation": 1.5,
    "End_Withdrawn": 0.5,
    "Task_AOB_010": 1.3,
    "Gateway_RetryAllowed": 1.3,
    "End_ParkedTechnical": 1.3,
    "Task_AOB_012": -1.4,
    "Task_AOB_014": 1.4,
    "Task_AOB_017": -1.3,
    "Gateway_SpecialistOutcome": -1.3,
    "Task_AOB_019": 1.3,
    "Gateway_RemediationAttempts": 1.3,
    "Task_RemediationEscalation": 1.3,
    "End_ParkedRemediation": 1.3,
    "Task_AOB_024": -1.4,
    "Task_AOB_026": 1.4,
}

KEY_NODE_NAMES = {
    "Task_AOB_003": "Request complete?",
    "Task_AOB_006": "Wait for approval outcome",
    "Task_AOB_011": "Run validations in parallel",
    "Task_AOB_015": "All validations complete",
    "Task_AOB_016": "Specialist review required?",
    "Task_AOB_018": "DQ outcome?",
    "Task_AOB_019": "Correct DQ failures",
    "Task_AOB_020": "Independent checker review",
}


def local_name(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def flow_color(name: str) -> str:
    normalized = name.lower()
    if any(word in normalized for word in ("fail", "reject", "exhausted", "exceeded", "withdraw", "park")):
        return "#B42318"
    if any(word in normalized for word in ("pass", "success", "approved", "approve", "complete")):
        return "#177245"
    if any(word in normalized for word in ("retry", "revalidate", "correction", "timeout")):
        return "#B54708"
    return "#475569"


def ordered_nodes(process: ET.Element) -> list[ET.Element]:
    return [child for child in process if local_name(child) in NODE_TAGS]


def ensure_lane_memberships(path: Path, process: ET.Element) -> dict[str, int]:
    lanes = process.findall("bpmn:laneSet/bpmn:lane", NS)
    assignments = LANE_ASSIGNMENTS.get(path.name)
    if assignments:
        for lane in lanes:
            for old_ref in lane.findall("bpmn:flowNodeRef", NS):
                lane.remove(old_ref)
            for node_id in assignments[lane.attrib["id"]]:
                ET.SubElement(lane, f"{{{BPMN}}}flowNodeRef").text = node_id

    lane_indexes: dict[str, int] = {}
    for index, lane in enumerate(lanes):
        for node_ref in lane.findall("bpmn:flowNodeRef", NS):
            if node_ref.text:
                lane_indexes[node_ref.text] = index
    return lane_indexes


def ensure_semantic_model(definitions: ET.Element, process: ET.Element) -> tuple[list[ET.Element], list[ET.Element]]:
    message_specs = [
        ("Message_ApprovalApproved", "Approval received"),
        ("Message_ApprovalRejected", "Rejection received"),
        ("Message_ApprovalWithdrawn", "Withdrawal received"),
    ]
    message_ids = {message_id for message_id, _ in message_specs}
    for element in list(definitions):
        if local_name(element) == "message" and element.attrib.get("id") in message_ids:
            definitions.remove(element)
    process_index = list(definitions).index(process)
    for message_id, name in message_specs:
        definitions.insert(process_index, ET.Element(f"{{{BPMN}}}message", {"id": message_id, "name": name}))
        process_index += 1

    auxiliary_ids = {node_id for _, node_id, _ in AUXILIARY_NODES}
    for element in list(process):
        if element.attrib.get("id") in auxiliary_ids or local_name(element) == "sequenceFlow":
            process.remove(element)

    validation_join = process.find("bpmn:exclusiveGateway[@id='Task_AOB_015']", NS)
    if validation_join is not None:
        validation_join.tag = f"{{{BPMN}}}parallelGateway"

    for kind, node_id, name in AUXILIARY_NODES:
        node = ET.SubElement(process, f"{{{BPMN}}}{kind}", {"id": node_id, "name": name})
        if node_id.startswith("Event_Approval") and node_id != "Event_ApprovalTimeout":
            message_id = node_id.replace("Event_", "Message_")
            ET.SubElement(node, f"{{{BPMN}}}messageEventDefinition", {"messageRef": message_id})
        elif node_id == "Event_ApprovalTimeout":
            definition = ET.SubElement(node, f"{{{BPMN}}}timerEventDefinition")
            duration = ET.SubElement(
                definition,
                f"{{{BPMN}}}timeDuration",
                {f"{{{XSI}}}type": "bpmn:tFormalExpression"},
            )
            duration.text = "PT24H"

    for node in ordered_nodes(process):
        if node.attrib["id"] in KEY_NODE_NAMES:
            node.attrib["name"] = KEY_NODE_NAMES[node.attrib["id"]]
        documentation = DOCUMENTATION.get(node.attrib["id"])
        if documentation:
            for old_documentation in node.findall("bpmn:documentation", NS):
                node.remove(old_documentation)
            element = ET.Element(f"{{{BPMN}}}documentation")
            element.text = documentation
            node.insert(0, element)

    for index, (source, target, name, condition) in enumerate(FLOW_SPECS, start=1):
        attributes = {"id": f"Flow_{index:03d}", "sourceRef": source, "targetRef": target}
        if name:
            attributes["name"] = name
        flow = ET.SubElement(process, f"{{{BPMN}}}sequenceFlow", attributes)
        if condition:
            expression = ET.SubElement(
                flow,
                f"{{{BPMN}}}conditionExpression",
                {f"{{{XSI}}}type": "bpmn:tFormalExpression"},
            )
            expression.text = condition

    return ordered_nodes(process), process.findall("bpmn:sequenceFlow", NS)


def add_diagram(
    definitions: ET.Element,
    process: ET.Element,
    nodes: list[ET.Element],
    flows: list[ET.Element],
    lane_indexes: dict[str, int],
) -> None:
    for old_diagram in definitions.findall("bpmndi:BPMNDiagram", NS):
        definitions.remove(old_diagram)

    lanes = process.findall("bpmn:laneSet/bpmn:lane", NS)
    lane_height = LANE_HEIGHT
    canvas_width = 360 + (max(NODE_COLUMNS.values()) + 1) * COLUMN_WIDTH
    diagram = ET.SubElement(definitions, f"{{{BPMNDI}}}BPMNDiagram", {"id": f"{process.attrib['id']}_Diagram"})
    plane = ET.SubElement(
        diagram,
        f"{{{BPMNDI}}}BPMNPlane",
        {"id": f"{process.attrib['id']}_Plane", "bpmnElement": process.attrib["id"]},
    )

    for index, lane in enumerate(lanes):
        shape = ET.SubElement(
            plane,
            f"{{{BPMNDI}}}BPMNShape",
            {
                "id": f"{lane.attrib['id']}_di",
                "bpmnElement": lane.attrib["id"],
                "isHorizontal": "true",
                f"{{{BIOC}}}fill": "#F7F9FC" if index % 2 == 0 else "#EEF3F8",
                f"{{{BIOC}}}stroke": "#6C8EBF",
            },
        )
        ET.SubElement(
            shape,
            f"{{{DC}}}Bounds",
            {"x": "20", "y": str(20 + index * lane_height), "width": str(canvas_width), "height": str(lane_height)},
        )

    bounds_by_node: dict[str, tuple[float, float, float, float]] = {}
    for node in nodes:
        kind = local_name(node)
        width, height = (36, 36) if kind.endswith("Event") else ((50, 50) if kind.endswith("Gateway") else (140, 80))
        x = 180 + NODE_COLUMNS[node.attrib["id"]] * COLUMN_WIDTH
        lane_index = lane_indexes.get(node.attrib["id"], 0)
        track = NODE_TRACKS.get(node.attrib["id"], 0)
        y = 20 + lane_index * lane_height + (lane_height - height) / 2 + track * 85
        fill, stroke = COLORS[kind]
        shape = ET.SubElement(
            plane,
            f"{{{BPMNDI}}}BPMNShape",
            {
                "id": f"{node.attrib['id']}_di",
                "bpmnElement": node.attrib["id"],
                f"{{{BIOC}}}fill": fill,
                f"{{{BIOC}}}stroke": stroke,
            },
        )
        ET.SubElement(
            shape,
            f"{{{DC}}}Bounds",
            {"x": str(x), "y": str(y), "width": str(width), "height": str(height)},
        )
        bounds_by_node[node.attrib["id"]] = (x, y, width, height)

    loop_index = 0
    diagram_bottom = 20 + len(lanes) * lane_height
    for flow in flows:
        source_left, source_top, source_width, source_height = bounds_by_node[flow.attrib["sourceRef"]]
        target_left, target_top, target_width, target_height = bounds_by_node[flow.attrib["targetRef"]]
        source_x = source_left + source_width
        source_y = source_top + source_height / 2
        target_x = target_left
        target_y = target_top + target_height / 2
        if target_left > source_left:
            if abs(source_y - target_y) < 1:
                waypoints = [(source_x, source_y), (target_x, target_y)]
            else:
                middle_x = (source_x + target_x) / 2
                waypoints = [
                    (source_x, source_y),
                    (middle_x, source_y),
                    (middle_x, target_y),
                    (target_x, target_y),
                ]
        else:
            channel_y = diagram_bottom + 55 + loop_index * 34
            loop_index += 1
            waypoints = [
                (source_x, source_y),
                (source_x + 35, source_y),
                (source_x + 35, channel_y),
                (target_x - 35, channel_y),
                (target_x - 35, target_y),
                (target_x, target_y),
            ]
        stroke = flow_color(flow.attrib.get("name", ""))
        edge = ET.SubElement(
            plane,
            f"{{{BPMNDI}}}BPMNEdge",
            {
                "id": f"{flow.attrib['id']}_di",
                "bpmnElement": flow.attrib["id"],
                f"{{{BIOC}}}stroke": stroke,
            },
        )
        for waypoint_x, waypoint_y in waypoints:
            ET.SubElement(edge, f"{{{DI}}}waypoint", {"x": str(waypoint_x), "y": str(waypoint_y)})


def write_drawio(
    source_path: Path,
    tree: ET.ElementTree,
    process: ET.Element,
    nodes: list[ET.Element],
    flows: list[ET.Element],
) -> Path:
    mxfile = ET.Element("mxfile", {"host": "app.diagrams.net", "agent": "BPMN repair utility", "version": "24.7.17"})
    diagram = ET.SubElement(mxfile, "diagram", {"id": process.attrib["id"], "name": process.attrib.get("name", "Process")})
    model = ET.SubElement(
        diagram,
        "mxGraphModel",
        {
            "dx": "1422",
            "dy": "794",
            "grid": "1",
            "gridSize": "10",
            "guides": "1",
            "tooltips": "1",
            "connect": "1",
            "arrows": "1",
            "fold": "1",
            "page": "1",
            "pageScale": "1",
            "pageWidth": "1169",
            "pageHeight": "827",
            "math": "0",
            "shadow": "0",
        },
    )
    root = ET.SubElement(model, "root")
    ET.SubElement(root, "mxCell", {"id": "0"})
    ET.SubElement(root, "mxCell", {"id": "1", "parent": "0"})

    diagram_node = tree.getroot().find("bpmndi:BPMNDiagram/bpmndi:BPMNPlane", NS)
    if diagram_node is None:
        raise ValueError("BPMN-DI plane was not generated")
    bounds_by_id = {
        shape.attrib["bpmnElement"]: shape.find("dc:Bounds", NS).attrib
        for shape in diagram_node.findall("bpmndi:BPMNShape", NS)
    }
    waypoints_by_flow = {
        edge.attrib["bpmnElement"]: [
            (point.attrib["x"], point.attrib["y"])
            for point in edge.findall("di:waypoint", NS)
        ]
        for edge in diagram_node.findall("bpmndi:BPMNEdge", NS)
    }

    lanes = process.findall("bpmn:laneSet/bpmn:lane", NS)
    for index, lane in enumerate(lanes):
        bounds = bounds_by_id[lane.attrib["id"]]
        fill = "#F7F9FC" if index % 2 == 0 else "#EEF3F8"
        cell = ET.SubElement(
            root,
            "mxCell",
            {
                "id": lane.attrib["id"],
                "value": lane.attrib.get("name", ""),
                "style": f"swimlane;horizontal=0;startSize=42;fillColor={fill};swimlaneFillColor={fill};strokeColor=#6C8EBF;fontColor=#1E3A5F;fontStyle=1;whiteSpace=wrap;html=1;",
                "vertex": "1",
                "parent": "1",
            },
        )
        ET.SubElement(cell, "mxGeometry", {**bounds, "as": "geometry"})

    for node in nodes:
        kind = local_name(node)
        bounds = bounds_by_id[node.attrib["id"]]
        fill, stroke = COLORS[kind]
        if kind.endswith("Event"):
            style = f"ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor={fill};strokeColor={stroke};strokeWidth=3;fontColor=#1F2937;"
        elif kind.endswith("Gateway"):
            style = f"rhombus;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};strokeWidth=2;fontColor=#1F2937;"
        else:
            style = f"rounded=1;arcSize=12;whiteSpace=wrap;html=1;fillColor={fill};strokeColor={stroke};strokeWidth=2;fontColor=#1F2937;"
        cell = ET.SubElement(
            root,
            "mxCell",
            {
                "id": node.attrib["id"],
                "value": node.attrib.get("name", ""),
                "style": style,
                "vertex": "1",
                "parent": "1",
            },
        )
        ET.SubElement(cell, "mxGeometry", {**bounds, "as": "geometry"})

    for flow in flows:
        stroke = flow_color(flow.attrib.get("name", ""))
        cell = ET.SubElement(
            root,
            "mxCell",
            {
                "id": flow.attrib["id"],
                "value": flow.attrib.get("name", ""),
                "style": f"edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=block;endFill=1;strokeColor={stroke};strokeWidth=2;fontStyle=1;labelBackgroundColor=#FFFFFF;",
                "edge": "1",
                "parent": "1",
                "source": flow.attrib["sourceRef"],
                "target": flow.attrib["targetRef"],
            },
        )
        geometry = ET.SubElement(cell, "mxGeometry", {"relative": "1", "as": "geometry"})
        intermediate_points = waypoints_by_flow[flow.attrib["id"]][1:-1]
        if intermediate_points:
            points = ET.SubElement(geometry, "Array", {"as": "points"})
            for point_x, point_y in intermediate_points:
                ET.SubElement(points, "mxPoint", {"x": point_x, "y": point_y})

    output_path = ROOT / f"{source_path.stem}.drawio"
    output_tree = ET.ElementTree(mxfile)
    ET.indent(output_tree, space="  ")
    output_tree.write(output_path, encoding="UTF-8", xml_declaration=True)
    return output_path


def repair(path: Path) -> None:
    tree = ET.parse(path)
    definitions = tree.getroot()
    process = definitions.find("bpmn:process", NS)
    if process is None:
        raise ValueError(f"No BPMN process found in {path.name}")
    nodes, flows = ensure_semantic_model(definitions, process)
    lane_indexes = ensure_lane_memberships(path, process)
    unassigned_nodes = {node.attrib["id"] for node in nodes} - set(lane_indexes)
    if unassigned_nodes:
        raise ValueError(f"Nodes missing lane assignments in {path.name}: {sorted(unassigned_nodes)}")
    add_diagram(definitions, process, nodes, flows, lane_indexes)
    ET.indent(tree, space="  ")
    tree.write(path, encoding="UTF-8", xml_declaration=True)
    drawio_path = write_drawio(path, tree, process, nodes, flows)
    print(f"Generated {drawio_path.name}")


if __name__ == "__main__":
    for bpmn_path in sorted(ROOT.glob("diagram*.bpmn")):
        repair(bpmn_path)
        print(f"Repaired {bpmn_path.name}")