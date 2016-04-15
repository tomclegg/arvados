transitions = {
 ('busy', 'closed', 'boot exceeded', 'idle exceeded'): None,
 ('busy', 'closed', 'boot exceeded', 'idle wait'): None,
 ('busy', 'closed', 'boot exceeded', 'not idle'): None,
 ('busy', 'closed', 'boot wait', 'idle exceeded'): None,
 ('busy', 'closed', 'boot wait', 'idle wait'): None,
 ('busy', 'closed', 'boot wait', 'not idle'): None,
 ('busy', 'open', 'boot exceeded', 'idle exceeded'): None,
 ('busy', 'open', 'boot exceeded', 'idle wait'): None,
 ('busy', 'open', 'boot exceeded', 'not idle'): None,
 ('busy', 'open', 'boot wait', 'idle exceeded'): None,
 ('busy', 'open', 'boot wait', 'idle wait'): None,
 ('busy', 'open', 'boot wait', 'not idle'): None,

 ('down', 'closed', 'boot exceeded', 'idle exceeded'): "START_SHUTDOWN",
 ('down', 'closed', 'boot exceeded', 'idle wait'): "START_SHUTDOWN",
 ('down', 'closed', 'boot exceeded', 'not idle'): "START_SHUTDOWN",
 ('down', 'closed', 'boot wait', 'idle exceeded'): "START_SHUTDOWN",
 ('down', 'closed', 'boot wait', 'idle wait'): "START_SHUTDOWN",
 ('down', 'closed', 'boot wait', 'not idle'): "START_SHUTDOWN",
 ('down', 'open', 'boot exceeded', 'idle exceeded'): "START_SHUTDOWN",
 ('down', 'open', 'boot exceeded', 'idle wait'): "START_SHUTDOWN",
 ('down', 'open', 'boot exceeded', 'not idle'): "START_SHUTDOWN",
 ('down', 'open', 'boot wait', 'idle exceeded'): "START_SHUTDOWN",
 ('down', 'open', 'boot wait', 'idle wait'): "START_SHUTDOWN",
 ('down', 'open', 'boot wait', 'not idle'): "START_SHUTDOWN",

 ('idle', 'closed', 'boot exceeded', 'idle exceeded'): None,
 ('idle', 'closed', 'boot exceeded', 'idle wait'): None,
 ('idle', 'closed', 'boot exceeded', 'not idle'): None,
 ('idle', 'closed', 'boot wait', 'idle exceeded'): None,
 ('idle', 'closed', 'boot wait', 'idle wait'): None,
 ('idle', 'closed', 'boot wait', 'not idle'): None,
 ('idle', 'open', 'boot exceeded', 'idle exceeded'): "START_DRAIN",
 ('idle', 'open', 'boot exceeded', 'idle wait'): None,
 ('idle', 'open', 'boot exceeded', 'not idle'): None,
 ('idle', 'open', 'boot wait', 'idle exceeded'): "START_DRAIN",
 ('idle', 'open', 'boot wait', 'idle wait'): None,
 ('idle', 'open', 'boot wait', 'not idle'): None,

 ('unpaired', 'closed', 'boot exceeded', 'idle exceeded'): "START_SHUTDOWN",
 ('unpaired', 'closed', 'boot exceeded', 'idle wait'): "START_SHUTDOWN",
 ('unpaired', 'closed', 'boot exceeded', 'not idle'): "START_SHUTDOWN",
 ('unpaired', 'closed', 'boot wait', 'idle exceeded'): None,
 ('unpaired', 'closed', 'boot wait', 'idle wait'): None,
 ('unpaired', 'closed', 'boot wait', 'not idle'): None,
 ('unpaired', 'open', 'boot exceeded', 'idle exceeded'): "START_SHUTDOWN",
 ('unpaired', 'open', 'boot exceeded', 'idle wait'): "START_SHUTDOWN",
 ('unpaired', 'open', 'boot exceeded', 'not idle'): "START_SHUTDOWN",
 ('unpaired', 'open', 'boot wait', 'idle exceeded'): None,
 ('unpaired', 'open', 'boot wait', 'idle wait'): None,
 ('unpaired', 'open', 'boot wait', 'not idle'): None}
