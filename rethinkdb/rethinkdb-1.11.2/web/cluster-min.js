var AlertUpdates, BackboneCluster, ComputedCluster, ConnectionStatus, Database, Databases, Datacenter, Datacenters, Directory, ISODateString, IsDisconnected, Issue, IssueRedundancy, Issues, IssuesRedundancy, LogEntry, Machine, MachineAttributes, Machines, Namespace, Namespaces, NavBarView, OptionsView, Progress, ProgressList, Settings, add_protocol_tag, apply_diffs, apply_to_collection, bind_dev_tools, clear_modals, collect_progress, collect_reql_doc, collect_server_data_async, collect_server_data_once, collect_stat_data, collections_ready, error_load_reql_docs, form_data_as_object, human_readable_shard, human_readable_shard_obj, human_readable_units, iso_date_from_unix_time, modal_registry, objects_are_equal, pretty_key, progress_interval_default_value, progress_interval_value, progress_short_interval, random_model_from, register_modal, render_body, render_loading, reset_collections, set_directory, set_issues, set_last_seen, set_progress, set_reql_docs, set_stats, statUpdateInterval, stats_param, units_space, updateInterval,
  __slice = [].slice,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

window.VERSION = '1.11.2';

Handlebars.registerHelper('debug', function() {
  var input, inputs, options, _i, _j, _len, _results;
  inputs = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), options = arguments[_i++];
  console.log(this, "Current Context");
  console.log(options, 'Options');
  if (input) {
    _results = [];
    for (_j = 0, _len = inputs.length; _j < _len; _j++) {
      input = inputs[_j];
      _results.push(console.log(input, 'Input ##{_i}'));
    }
    return _results;
  }
});

Handlebars.registerHelper('prettify_date', function(date) {
  return new XDate(date * 1000).toString("HH:mm - MMMM dd, yyyy");
});

Handlebars.registerHelper('comma_separated', function(context, block) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = context.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += block(context[i]);
    if (i !== context.length - 1) {
      out += ", ";
    }
  }
  return out;
});

Handlebars.registerHelper('comma_separated_simple', function(context) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = context.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += context[i];
    if (i !== context.length - 1) {
      out += ", ";
    }
  }
  return out;
});

Handlebars.registerHelper('html_list', function(context) {
  var i, out, _i, _ref;
  out = "<ul>";
  for (i = _i = 0, _ref = context.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<li>' + context[i] + '</li>';
  }
  out += '</ul>';
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('links_to_machines', function(machines, safety) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = machines.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    if (machines[i].exists) {
      out += '<a href="#servers/' + machines[i].id + '" class="links_to_other_view">' + machines[i].name + '</a>';
    } else {
      out += machines[i].name;
    }
    if (i !== machines.length - 1) {
      out += ", ";
    }
  }
  if ((safety != null) && safety === false) {
    return out;
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('links_to_machines_inline', function(machines) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = machines.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<a href="#servers/' + machines[i].uid + '" class="links_to_other_view">' + machines[i].name + '</a>';
    if (i !== machines.length - 1) {
      out += ", ";
    }
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('links_to_namespaces', function(namespaces) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = namespaces.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<p><a href="#tables/' + namespaces[i].id + '" class="links_to_other_view">' + namespaces[i].name + '</a></p>';
  }
  return out;
});

Handlebars.registerHelper('links_to_namespaces_inline', function(namespaces) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = namespaces.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<a href="#tables/' + namespaces[i].id + '" class="links_to_other_view">' + namespaces[i].name + '</a>';
    if (i !== namespaces.length - 1) {
      out += ", ";
    }
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('links_to_datacenters_inline', function(datacenters) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = datacenters.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<a href="#datacenters/' + datacenters[i].id + '" class="links_to_other_view">' + datacenters[i].name + '</a>';
    if (i !== datacenters.length - 1) {
      out += ", ";
    }
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('links_to_datacenters_inline_for_replica', function(datacenters) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = datacenters.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<strong>' + datacenters[i].name + '</strong>';
    if (i !== datacenters.length - 1) {
      out += ", ";
    }
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('links_to_masters_and_namespaces', function(machines) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = machines.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<p><a href="#tables/' + machines[i].namespace_id + '" class="links_to_other_view">' + machines[i].namespace_name + '</a> (<a href="#servers/' + machines[i].machine_id + '" class="links_to_other_view">' + machines[i].machine_name + '</a>)</p>';
  }
  return out;
});

Handlebars.registerHelper('links_to_replicas_and_namespaces', function(machines) {
  var i, out, _i, _ref;
  out = "";
  for (i = _i = 0, _ref = machines.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
    out += '<p><a href="#tables/' + machines[i].get('namespace_uuid') + '" class="links_to_other_view">' + machines[i].get('namespace_name') + '</a> (<a href="#servers/' + machines[i].get('machine_id') + '" class="links_to_other_view">' + machines[i].get('machine_name') + '</a>)</p>';
    out += '<ul><li>Shard: ' + machines[i].get('shard') + '</li>';
    out += '<li>Blueprint: ' + machines[i].get('blueprint') + '</li>';
    out += '<li>Directory: ' + machines[i].get('directory') + '</li></ul>';
  }
  return out;
});

Handlebars.registerHelper('display_reasons_cannot_move', function(reasons) {
  var is_first, machine_id, namespace_id, namespace_name, out, reason, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
  out = "";
  for (machine_id in reasons) {
    if (((_ref = reasons[machine_id]['master']) != null ? _ref.length : void 0) > 0) {
      out += '<li>The server <a href="#servers/' + machine_id + '">' + machines.get(machine_id).get('name') + '</a> is master for some shards of the tables ';
      is_first = true;
      _ref1 = reasons[machine_id]['master'];
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        reason = _ref1[_i];
        namespace_id = reason.namespace_id;
        namespace_name = namespaces.get(namespace_id).get('name');
        if (is_first) {
          out += '<a href="#tables/' + namespace_id + '">' + namespace_name + '</a>';
          is_first = false;
        } else {
          out += ', <a href="#tables/' + namespace_id + '">' + namespace_name + '</a>';
        }
      }
      out += '</li>';
    }
    if (((_ref2 = reasons[machine_id]['goals']) != null ? _ref2.length : void 0) > 0) {
      out += '<li>Moving the table <a href="#servers/' + machine_id + '">' + machines.get(machine_id).get('name') + '</a> will result in unsatisfiable goals for the tables ';
      is_first = true;
      _ref3 = reasons[machine_id]['goals'];
      for (_j = 0, _len1 = _ref3.length; _j < _len1; _j++) {
        reason = _ref3[_j];
        namespace_id = reason.namespace_id;
        namespace_name = namespaces.get(namespace_id).get('name');
        if (is_first) {
          out += '<a href="#tables/' + namespace_id + '">' + namespace_name + '</a>';
          is_first = false;
        } else {
          out += ', <a href="#tables/' + namespace_id + '">' + namespace_name + '</a>';
        }
      }
      out += '.</li>';
    }
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('ifequal', function(val_a, val_b, if_block, else_block) {
  if (val_a === val_b) {
    return if_block();
  } else if (else_block != null) {
    return else_block();
  }
});

Handlebars.registerHelper('pluralize_noun', function(noun, num, capitalize) {
  var ends_with_y, result;
  ends_with_y = noun.substr(-1) === 'y';
  if (num === 1) {
    result = noun;
  } else {
    if (ends_with_y && (noun !== 'key')) {
      result = noun.slice(0, noun.length - 1) + "ies";
    } else if (noun.substr(-1) === 's') {
      result = noun + "es";
    } else {
      result = noun + "s";
    }
  }
  if (capitalize === true) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  return result;
});

Handlebars.registerHelper('pluralize_verb_to_be', function(num) {
  if (num === 1) {
    return 'is';
  } else {
    return 'are';
  }
});

Handlebars.registerHelper('pluralize_verb_to_have', function(num) {
  if (num === 1) {
    return 'has';
  } else {
    return 'have';
  }
});

Handlebars.registerHelper('pluralize_verb', function(verb, num) {
  if (num === 1) {
    return verb + 's';
  } else {
    return verb;
  }
});

Handlebars.registerHelper('pluralize_its', function(num) {
  if (num === 1) {
    return 'its';
  } else {
    return 'their';
  }
});

Handlebars.registerHelper('pluralize_this', function(num) {
  if (num === 1) {
    return 'this';
  } else {
    return 'these';
  }
});

Handlebars.registerHelper('capitalize', function(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
});

Handlebars.registerHelper('humanize_uuid', function(str) {
  return str.substr(0, 6);
});

Handlebars.registerHelper('humanize_role', function(role) {
  if (role === 'role_primary') {
    return new Handlebars.SafeString('<span class="master responsability master">Master</span>');
  }
  if (role === 'role_secondary') {
    return new Handlebars.SafeString('<span class="secondary responsability secondary">Secondary</span>');
  }
  if (role === 'role_nothing') {
    return new Handlebars.SafeString('<span class="secondary responsability nothing">Nothing</span>');
  }
  return role;
});

Handlebars.registerHelper('humanize_machine_reachability', function(status) {
  var result;
  if (!(status != null)) {
    result = 'N/A';
  } else {
    if (status.reachable) {
      result = "<span class='label label-success'>Reachable</span>";
    } else {
      result = "<span class='label label-failure'>Unreachable</span>";
    }
  }
  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('humanize_datacenter_reachability', function(status) {
  var result;
  if (status.reachable > 0) {
    result = "<span class='label label-success'>Live</span>";
  } else {
    if (status.total > 0) {
      result = "<span class='label label-important'>Down</span>";
    } else {
      result = "<span class='label'>Empty</span>";
    }
  }
  if (status.reachable === 0 && status.total > 0) {
    result += "<br/><span class='timeago' title='" + status.last_seen + "'>since " + status.last_seen + "</abbr>";
  }
  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('humanize_namespace_reachability', function(reachability) {
  var result;
  if (reachability === 'Live') {
    result = "<span class='label label-success'>Live</span>";
  } else {
    result = "<span class='label label-failure'>Down</span>";
  }
  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('display_datacenter_in_namespace', function(datacenter, role) {
  var result;
  result = '<tr>';
  result += '<td class="role">' + role + '</td>';
  result += '<td class="datacenter_name"><a href="#datacenters/' + datacenter.id + '">' + datacenter.name + '</a></td>';
  result += '<td>Replicas: ' + datacenter.replicas + '</td>';
  result += '<td>/</td>';
  result += '<td>Machines ' + datacenter.total_machines + '</td>';
  result += '</tr>';
  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('display_primary_and_secondaries', function(primary, secondaries) {
  var display_role, result, secondary, _i, _len;
  result = '<table class="datacenter_list">';
  if ((primary.id != null) && primary.id !== '') {
    result += new Handlebars.helpers.display_datacenter_in_namespace(primary, "Primary");
  } else {
    result += '<tr><td class="role" colspan="5">No primary was found</td></tr>';
  }
  display_role = true;
  for (_i = 0, _len = secondaries.length; _i < _len; _i++) {
    secondary = secondaries[_i];
    if (display_role) {
      display_role = false;
      result += new Handlebars.helpers.display_datacenter_in_namespace(secondary, "Secondaries");
    } else {
      result += new Handlebars.helpers.display_datacenter_in_namespace(secondary, "");
    }
  }
  result += '</table>';
  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('display_truncated_machines', function(data) {
  var machine, machines, more_link_should_be_displayed, num_displayed_machine, out, _i, _len;
  machines = data.machines;
  out = '';
  num_displayed_machine = 0;
  more_link_should_be_displayed = data.more_link_should_be_displayed;
  for (_i = 0, _len = machines.length; _i < _len; _i++) {
    machine = machines[_i];
    out += '<li><a href="#servers/' + machine.id + '">' + machine.name + '</a>' + Handlebars.helpers.humanize_machine_reachability(machine.status) + '</li>';
    num_displayed_machine++;
    if (machine.status.reachable !== true) {
      num_displayed_machine++;
    }
    if (more_link_should_be_displayed === true && num_displayed_machine > 6) {
      more_link_should_be_displayed = false;
      out += '<li class="more_machines"><a href="#" class="display_more_machines">» More</a></li>';
    }
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('print_safe', function(str) {
  if (str != null) {
    return new Handlebars.SafeString(str);
  } else {
    return "";
  }
});

Handlebars.registerPartial('backfill_progress_summary', $('#backfill_progress_summary-partial').html());

Handlebars.registerPartial('backfill_progress_details', $('#backfill_progress_details-partial').html());

window.pause_live_data = false;

window.log_initial = function(msg) {};

window.log_render = function(msg) {};

window.log_action = function(msg) {};

window.log_router = function(msg) {};

window.log_binding = function(msg) {};

window.log_ajax = function(msg) {};

window.class_name = function(obj) {
  return obj.__proto__.constructor.name;
};

ISODateString = function(d) {
  var pad;
  pad = function(n) {
    if (n < 10) {
      return '0' + n;
    } else {
      return n;
    }
  };
  return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':' + pad(d.getUTCSeconds()) + 'Z';
};

random_model_from = function(collection) {
  return _.shuffle(collection.models)[0];
};

iso_date_from_unix_time = function(unix_time) {
  return ISODateString(new Date(unix_time * 1000));
};

form_data_as_object = function(form) {
  var formarray, formdata, x, _i, _len;
  formarray = form.serializeArray();
  formdata = {};
  for (_i = 0, _len = formarray.length; _i < _len; _i++) {
    x = formarray[_i];
    formdata[x.name] = x.value;
  }
  return formdata;
};

pretty_key = function(s) {
  if (s === null) {
    return "+∞";
  } else if (s === "") {
    return "-∞";
  } else if (typeof s === "string" && (s[0] != null) && s[0] === 'N') {
    s = s.slice(s.indexOf("%23") + 3);
    if (_.isNaN(parseFloat(s)) === false) {
      return parseFloat(s);
    } else {
      return NaN;
    }
  } else if (typeof s === "string" && (s[0] != null) && s[0] === 'S') {
    s = s.slice(1);
    s = s.replace(/%21/g, '!');
    s = s.replace(/%22/g, '"');
    s = s.replace(/%23/g, '#');
    s = s.replace(/%24/g, '$');
    s = s.replace(/%25/g, '%');
    s = s.replace(/%26/g, '&');
    s = s.replace(/%27/g, '\'');
    s = s.replace(/%28/g, '(');
    s = s.replace(/%29/g, ')');
    s = s.replace(/%2A/g, '*');
    s = s.replace(/%2B/g, '+');
    s = s.replace(/%2C/g, ',');
    s = s.replace(/%2D/g, '-');
    s = s.replace(/%2E/g, '.');
    s = s.replace(/%2F/g, '/');
    s = s.replace(/%3A/g, ':');
    s = s.replace(/%3B/g, ';');
    s = s.replace(/%3C/g, '<');
    s = s.replace(/%3D/g, '=');
    s = s.replace(/%3E/g, '>');
    s = s.replace(/%3F/g, '?');
    s = s.replace(/%40/g, '@');
    s = s.replace(/%5B/g, '[');
    s = s.replace(/%5C/g, '\\');
    s = s.replace(/%5D/g, ']');
    s = s.replace(/%60/g, '`');
    s = s.replace(/%7B/g, '{');
    s = s.replace(/%7C/g, '|');
    s = s.replace(/%7D/g, '}');
    s = s.replace(/%7E/g, '}');
    s = s.replace(/%7F/g, '}');
    return s;
  } else {
    return s;
  }
};

human_readable_shard_obj = function(shard) {
  var from, json_shard, name_len, to;
  name_len = 8;
  json_shard = $.parseJSON(shard);
  from = pretty_key(json_shard[0]).toString();
  to = pretty_key(json_shard[1]).toString();
  return {
    from: "" + (from.slice(0, 8)) + (from.length > name_len ? '...' : ''),
    to: "" + (to.slice(0, 8)) + (to.length > name_len ? '...' : '')
  };
};

human_readable_shard = function(shard) {
  shard = human_readable_shard_obj(shard);
  return "" + shard.from + " to " + shard.to;
};

units_space = ["B", "KB", "MB", "GB", "TB", "PB"];

human_readable_units = function(num, units) {
  var index, num_str, _tmp;
  if (!(num != null)) {
    return "N/A";
  }
  index = 0;
  while (true) {
    _tmp = num / 1024;
    if (_tmp < 1) {
      break;
    } else {
      index += 1;
      num /= 1024;
    }
    if (index > units_space.length - 1) {
      return "N/A";
    }
  }
  num_str = num.toFixed(1);
  if (("" + num_str)[num_str.length - 1] === '0') {
    num_str = num.toFixed(0);
  }
  return "" + num_str + units_space[index];
};

bind_dev_tools = function() {
  $('body').bind('keydown', 'alt+d', function() {
    return $('#dev-tools').toggle();
  });
  $('#live-data').click(function(e) {
    var pause_live_data;
    $(this).text($(this).text() === 'Pause live data feed' ? 'Resume live data feed' : 'Pause live data feed');
    pause_live_data = !pause_live_data;
    return false;
  });
  $('#reset-simulation-data').click(function(e) {
    $.ajax({
      contentType: 'application/json',
      url: 'ajax/reset_data',
      success: function() {
        return console.log('Reset simulation data.');
      }
    });
    return false;
  });
  $('#reset-session').click(function(e) {
    $.ajax({
      contentType: 'application/json',
      url: 'ajax/reset_session',
      success: function() {
        return console.log('Reset session.');
      }
    });
    return false;
  });
  $('#fetch-backbone-data').click(function(e) {
    var collection, _i, _len, _ref, _results;
    _ref = [datacenters, namespaces, machines];
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      collection = _ref[_i];
      _results.push(collection.fetch());
    }
    return _results;
  });
  $('#make-diff').click(function(e) {
    $.ajax({
      contentType: 'application/json',
      url: 'ajax/make_diff',
      success: function() {
        return console.log('Made diff to simulation data.');
      }
    });
    return false;
  });
  return $('#visit_bad_route').click(function(e) {
    $.get('/fakeurl');
    return false;
  });
};

objects_are_equal = function(a, b) {
  var i, key, _i, _ref;
  for (key in a) {
    if (!key in b) {
      return false;
    }
  }
  for (key in b) {
    if (!key in a) {
      return false;
    }
  }
  for (key in a) {
    if (!key in b) {
      return false;
    } else {
      if (typeof a[key] !== typeof b[key]) {
        return false;
      } else if ((a[key].constructor != null) && a[key].constructor === Array) {
        if ((b[key].constructor != null) && b[key].constructor === Array) {
          if (a[key].length !== b[key].length) {
            return false;
          } else {
            for (i = _i = 0, _ref = a[key].length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
              if (a[key][i] !== b[key][i]) {
                return false;
              }
            }
          }
        } else {
          return false;
        }
      } else if (typeof a[key] === 'object') {
        if (objects_are_equal(a[key], b[key]) === false) {
          return false;
        }
      } else if (a[key] !== b[key]) {
        return false;
      }
    }
  }
  return true;
};

/*
    Taken from "Namespacing and modules with Coffeescript"
    https://github.com/jashkenas/coffee-script/wiki/Easy-modules-with-coffeescript

    Introduces module function that allows namespaces by enclosing classes in anonymous functions.

    Usage:
    ------------------------------
        @module "foo", ->
          @module "bar", ->
            class @Amazing
              toString: "ain't it"
    ------------------------------

    Or, more simply:
    ------------------------------
        @module "foo.bar", ->
          class @Amazing
            toString: "ain't it"
    ------------------------------

    Which can then be accessed with:
    ------------------------------
        x = new foo.bar.Amazing
    ------------------------------
*/


this.module = function(names, fn) {
  var space, _name;
  if (typeof names === 'string') {
    names = names.split('.');
  }
  space = this[_name = names.shift()] || (this[_name] = {});
  space.module || (space.module = this.module);
  if (names.length) {
    return space.module(names, fn);
  } else {
    return fn.call(space);
  }
};

render_loading = function() {
  var template;
  template = Handlebars.templates['loading-page-template'];
  return $('body').html(template());
};

render_body = function() {
  var options_view_container, template;
  template = Handlebars.templates['body-structure-template'];
  $('body').html(template());
  options_view_container = $('.options_background');
  window.options_view = new OptionsView(options_view_container);
  options_view_container.html(options_view.render().$el);
  window.alert_update_view = new AlertUpdates;
  $('.updates_container').html(window.alert_update_view.render().$el);
  $('.modal').modal({
    backdrop: true,
    keyboard: true
  });
  return $('#dev-tools #pause-application').on('click', function(event) {
    debugger;
  });
};

OptionsView = (function(_super) {

  __extends(OptionsView, _super);

  function OptionsView() {
    this.turn_updates_off = __bind(this.turn_updates_off, this);

    this.turn_updates_on = __bind(this.turn_updates_on, this);

    this.toggle_options = __bind(this.toggle_options, this);

    this.hide = __bind(this.hide, this);

    this.render = __bind(this.render, this);
    return OptionsView.__super__.constructor.apply(this, arguments);
  }

  OptionsView.prototype.className = 'options_full_container';

  OptionsView.prototype.template = Handlebars.templates['options_view-template'];

  OptionsView.prototype.events = {
    'click .close': 'toggle_options',
    'click label[for=updates_yes]': 'turn_updates_on',
    'click label[for=updates_no]': 'turn_updates_off'
  };

  OptionsView.prototype.initialize = function(main_container) {
    return this.main_container = main_container;
  };

  OptionsView.prototype.render = function() {
    var _ref;
    this.$el.html(this.template({
      check_update: ((_ref = window.localStorage) != null ? _ref.check_updates : void 0) != null ? JSON.parse(window.localStorage.check_updates) : true,
      version: window.VERSION
    }));
    return this;
  };

  OptionsView.prototype.hide = function(event) {
    event.preventDefault();
    this.options_state = 'hidden';
    $('.options_container_arrow_overlay').hide();
    this.main_container.slideUp('fast', function() {
      return $('.options_background').hide();
    });
    return this.$('.cog_icon').removeClass('active');
  };

  OptionsView.prototype.toggle_options = function(event) {
    event.preventDefault();
    if (this.options_state === 'visible') {
      return this.hide(event);
    } else {
      this.options_state = 'visible';
      $('.options_container_arrow_overlay').show();
      this.main_container.slideDown('fast');
      return this.delegateEvents();
    }
  };

  OptionsView.prototype.turn_updates_on = function(event) {
    window.localStorage.check_updates = JSON.stringify(true);
    window.localStorage.removeItem('ignore_version');
    return window.alert_update_view.check();
  };

  OptionsView.prototype.turn_updates_off = function(event) {
    window.localStorage.check_updates = JSON.stringify(false);
    return window.alert_update_view.hide();
  };

  return OptionsView;

})(Backbone.View);

AlertUpdates = (function(_super) {

  __extends(AlertUpdates, _super);

  function AlertUpdates() {
    this.deactivate_update = __bind(this.deactivate_update, this);

    this.render = __bind(this.render, this);

    this.compare_version = __bind(this.compare_version, this);

    this.render_updates = __bind(this.render_updates, this);

    this.check = __bind(this.check, this);

    this.hide = __bind(this.hide, this);

    this.close = __bind(this.close, this);

    this.initialize = __bind(this.initialize, this);
    return AlertUpdates.__super__.constructor.apply(this, arguments);
  }

  AlertUpdates.prototype.has_update_template = Handlebars.templates['has_update-template'];

  AlertUpdates.prototype.className = 'settings alert';

  AlertUpdates.prototype.events = {
    'click .no_update_btn': 'deactivate_update',
    'click .close': 'close'
  };

  AlertUpdates.prototype.initialize = function() {
    var check_updates;
    if (window.localStorage != null) {
      try {
        check_updates = JSON.parse(window.localStorage.check_updates);
        if (check_updates !== false) {
          return this.check();
        }
      } catch (err) {
        window.localStorage.check_updates = JSON.stringify(true);
        return this.check();
      }
    } else {
      return this.check();
    }
  };

  AlertUpdates.prototype.close = function(event) {
    event.preventDefault();
    if (this.next_version != null) {
      window.localStorage.ignore_version = JSON.stringify(this.next_version);
    }
    return this.hide();
  };

  AlertUpdates.prototype.hide = function() {
    return this.$el.slideUp('fast');
  };

  AlertUpdates.prototype.check = function() {
    return $.getJSON("http://update.rethinkdb.com/update_for/" + window.VERSION + "?callback=?", this.render_updates);
  };

  AlertUpdates.prototype.render_updates = function(data) {
    var ignored_version;
    if (data.status === 'need_update') {
      try {
        ignored_version = JSON.parse(window.localStorage.ignore_version);
      } catch (err) {
        ignored_version = null;
      }
      if ((!ignored_version) || this.compare_version(ignored_version, data.last_version) < 0) {
        this.next_version = data.last_version;
        this.$el.html(this.has_update_template({
          last_version: data.last_version,
          link_changelog: data.link_changelog
        }));
        return this.$el.slideDown('fast');
      }
    }
  };

  AlertUpdates.prototype.compare_version = function(v1, v2) {
    var index, v1_array, v1_array_str, v2_array, v2_array_str, value, _i, _j, _k, _len, _len1, _len2;
    v1_array_str = v1.split('.');
    v2_array_str = v2.split('.');
    v1_array = [];
    for (_i = 0, _len = v1_array_str.length; _i < _len; _i++) {
      value = v1_array_str[_i];
      v1_array.push(parseInt(value));
    }
    v2_array = [];
    for (_j = 0, _len1 = v2_array_str.length; _j < _len1; _j++) {
      value = v2_array_str[_j];
      v2_array.push(parseInt(value));
    }
    for (index = _k = 0, _len2 = v1_array.length; _k < _len2; index = ++_k) {
      value = v1_array[index];
      if (value < v2_array[index]) {
        return -1;
      } else if (value > v2_array[index]) {
        return 1;
      }
    }
    return 0;
  };

  AlertUpdates.prototype.render = function() {
    return this;
  };

  AlertUpdates.prototype.deactivate_update = function() {
    this.$el.slideUp('fast');
    if (window.localStorage != null) {
      return window.localStorage.check_updates = JSON.stringify(false);
    }
  };

  return AlertUpdates;

})(Backbone.View);

Settings = (function(_super) {

  __extends(Settings, _super);

  function Settings() {
    this.render = __bind(this.render, this);

    this.change_settings = __bind(this.change_settings, this);

    this.initialize = __bind(this.initialize, this);

    this.close = __bind(this.close, this);
    return Settings.__super__.constructor.apply(this, arguments);
  }

  Settings.prototype.settings_template = Handlebars.templates['settings-template'];

  Settings.prototype.events = {
    'click .check_updates_btn': 'change_settings',
    'click .close': 'close'
  };

  Settings.prototype.close = function(event) {
    event.preventDefault();
    this.$el.parent().hide();
    return this.$el.remove();
  };

  Settings.prototype.initialize = function(args) {
    var _ref;
    this.alert_view = args.alert_view;
    if (((_ref = window.localStorage) != null ? _ref.check_updates : void 0) != null) {
      return this.check_updates = JSON.parse(window.localStorage.check_updates);
    } else {
      return this.check_updates = true;
    }
  };

  Settings.prototype.change_settings = function(event) {
    var update;
    update = this.$(event.target).data('update');
    if (update === 'on') {
      this.check_updates = true;
      if (window.localStorage != null) {
        window.localStorage.check_updates = JSON.stringify(true);
      }
      this.alert_view.check();
    } else if (update === 'off') {
      this.check_updates = false;
      this.alert_view.hide();
      if (window.localStorage != null) {
        window.localStorage.check_updates = JSON.stringify(false);
        window.localStorage.removeItem('ignore_version');
      }
    }
    return this.render();
  };

  Settings.prototype.render = function() {
    this.$el.html(this.settings_template({
      check_value: this.check_updates ? 'off' : 'on'
    }));
    this.delegateEvents();
    return this;
  };

  return Settings;

})(Backbone.View);

IsDisconnected = (function(_super) {

  __extends(IsDisconnected, _super);

  function IsDisconnected() {
    this.display_fail = __bind(this.display_fail, this);

    this.animate_loading = __bind(this.animate_loading, this);

    this.render = __bind(this.render, this);

    this.initialize = __bind(this.initialize, this);
    return IsDisconnected.__super__.constructor.apply(this, arguments);
  }

  IsDisconnected.prototype.el = 'body';

  IsDisconnected.prototype.className = 'is_disconnected_view';

  IsDisconnected.prototype.template = Handlebars.templates['is_disconnected-template'];

  IsDisconnected.prototype.message = Handlebars.templates['is_disconnected_message-template'];

  IsDisconnected.prototype.initialize = function() {
    log_initial('(initializing) sidebar view:');
    return this.render();
  };

  IsDisconnected.prototype.render = function() {
    this.$('#modal-dialog > .modal').css('z-index', '1');
    this.$('.modal-backdrop').remove();
    this.$el.append(this.template);
    this.$('.is_disconnected').modal({
      'show': true,
      'backdrop': 'static'
    });
    return this.animate_loading();
  };

  IsDisconnected.prototype.animate_loading = function() {
    if (this.$('.three_dots_connecting')) {
      if (this.$('.three_dots_connecting').html() === '...') {
        this.$('.three_dots_connecting').html('');
      } else {
        this.$('.three_dots_connecting').append('.');
      }
      return setTimeout(this.animate_loading, 300);
    }
  };

  IsDisconnected.prototype.display_fail = function() {
    var _this = this;
    return this.$('.animation_state').fadeOut('slow', function() {
      $('.reconnecting_state').html(_this.message);
      return $('.animation_state').fadeIn('slow');
    });
  };

  return IsDisconnected;

})(Backbone.View);

module('UIComponents', function() {
  this.AbstractModal = (function(_super) {

    __extends(AbstractModal, _super);

    function AbstractModal() {
      this.find_custom_button = __bind(this.find_custom_button, this);

      this.add_custom_button = __bind(this.add_custom_button, this);

      this.on_error = __bind(this.on_error, this);

      this.on_submit = __bind(this.on_submit, this);

      this.on_success = __bind(this.on_success, this);

      this.reset_buttons = __bind(this.reset_buttons, this);

      this.check_keypress_is_enter = __bind(this.check_keypress_is_enter, this);

      this.hide_modal = __bind(this.hide_modal, this);

      this.render = __bind(this.render, this);
      return AbstractModal.__super__.constructor.apply(this, arguments);
    }

    AbstractModal.prototype.template_outer = Handlebars.templates['abstract-modal-outer-template'];

    AbstractModal.prototype.error_template = Handlebars.templates['error_input-template'];

    AbstractModal.prototype.events = {
      'click .cancel': 'cancel_modal',
      'click .close_modal': 'cancel_modal',
      'click .btn-primary': 'abstract_submit',
      'keypress input': 'check_keypress_is_enter',
      'click .alert .close': 'close_error'
    };

    AbstractModal.prototype.close_error = function(event) {
      event.preventDefault();
      return $(event.currentTarget).parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    AbstractModal.prototype.initialize = function() {
      this.$container = $('#modal-dialog');
      return this.custom_buttons = [];
    };

    AbstractModal.prototype.render = function(template_data) {
      var btn, _i, _len, _ref,
        _this = this;
      if (!(template_data != null)) {
        template_data = {};
      }
      template_data = _.extend(template_data, {
        modal_class: this["class"]
      });
      this.$container.html(this.template_outer(template_data));
      $('.modal-body', this.$container).html(this.template(template_data));
      this.$modal = $('.modal', this.$container).modal({
        'show': true,
        'backdrop': true,
        'keyboard': true
      }).on('hidden', function() {
        return _this.$modal.remove();
      });
      this.setElement(this.$modal);
      this.delegateEvents();
      _ref = this.custom_buttons;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        btn = _ref[_i];
        this.$('.custom_btn_placeholder').append("<button class='btn " + btn.class_str + "' data-loading-text='" + btn.data_loading_text + "'>" + btn.main_text + "</button>");
        this.$('.custom_btn_placeholder > .' + btn.class_str).click(function(e) {
          return btn.on_click(e);
        });
        this.$('.custom_btn_placeholder > .' + btn.class_str).button();
      }
      return register_modal(this);
    };

    AbstractModal.prototype.hide_modal = function() {
      if (this.$modal != null) {
        this.$modal.modal('hide');
      }
      return this.destroy();
    };

    AbstractModal.prototype.cancel_modal = function(e) {
      this.hide_modal();
      return e.preventDefault();
    };

    AbstractModal.prototype.check_keypress_is_enter = function(event) {
      if (event.which === 13) {
        event.preventDefault();
        return this.abstract_submit(event);
      }
    };

    AbstractModal.prototype.abstract_submit = function(event) {
      event.preventDefault();
      return this.on_submit(event);
    };

    AbstractModal.prototype.reset_buttons = function() {
      this.$('.btn-primary').button('reset');
      return this.$('.cancel').button('reset');
    };

    AbstractModal.prototype.on_success = function(response) {
      this.reset_buttons();
      return clear_modals();
    };

    AbstractModal.prototype.on_submit = function(event) {
      this.$('.btn-primary').button('loading');
      return this.$('.cancel').button('loading');
    };

    AbstractModal.prototype.on_error = function(error) {
      this.$('.alert_modal').html(this.error_template({
        ajax_fail: true,
        error: ((error != null) && error !== '' ? error : void 0)
      }));
      if (this.$('.alert_modal_content').css('display') === 'none') {
        this.$('.alert_modal_content').slideDown('fast');
      } else {
        this.$('.alert_modal_content').css('display', 'none');
        this.$('.alert_modal_content').fadeIn();
      }
      return this.reset_buttons();
    };

    AbstractModal.prototype.add_custom_button = function(main_text, class_str, data_loading_text, on_click) {
      return this.custom_buttons.push({
        main_text: main_text,
        class_str: class_str,
        data_loading_text: data_loading_text,
        on_click: on_click
      });
    };

    AbstractModal.prototype.find_custom_button = function(class_str) {
      return this.$('.custom_btn_placeholder > .' + class_str);
    };

    return AbstractModal;

  })(Backbone.View);
  this.ConfirmationDialogModal = (function(_super) {

    __extends(ConfirmationDialogModal, _super);

    function ConfirmationDialogModal() {
      return ConfirmationDialogModal.__super__.constructor.apply(this, arguments);
    }

    ConfirmationDialogModal.prototype.template = Handlebars.templates['confirmation_dialog-template'];

    ConfirmationDialogModal.prototype["class"] = 'confirmation-modal';

    ConfirmationDialogModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: confirmation');
      return ConfirmationDialogModal.__super__.initialize.apply(this, arguments);
    };

    ConfirmationDialogModal.prototype.render = function(message, _url, _data, _on_success) {
      log_render('(rendering) add secondary dialog');
      this.url = _url;
      this.data = _data;
      this.on_user_success = _on_success;
      ConfirmationDialogModal.__super__.render.call(this, {
        message: message,
        modal_title: 'Confirmation',
        btn_secondary_text: 'No',
        btn_primary_text: 'Yes'
      });
      return this.$('.btn-primary').focus();
    };

    ConfirmationDialogModal.prototype.on_submit = function() {
      ConfirmationDialogModal.__super__.on_submit.apply(this, arguments);
      return $.ajax({
        processData: false,
        url: this.url,
        type: 'POST',
        contentType: 'application/json',
        data: this.data,
        success: this.on_success,
        error: this.on_error
      });
    };

    ConfirmationDialogModal.prototype.on_success = function(response) {
      ConfirmationDialogModal.__super__.on_success.apply(this, arguments);
      return this.on_user_success(response);
    };

    return ConfirmationDialogModal;

  })(this.AbstractModal);
  return this.RenameItemModal = (function(_super) {

    __extends(RenameItemModal, _super);

    function RenameItemModal() {
      return RenameItemModal.__super__.constructor.apply(this, arguments);
    }

    RenameItemModal.prototype.template = Handlebars.templates['rename_item-modal-template'];

    RenameItemModal.prototype.alert_tmpl = Handlebars.templates['renamed_item-alert-template'];

    RenameItemModal.prototype.error_template = Handlebars.templates['error_input-template'];

    RenameItemModal.prototype["class"] = 'rename-item-modal';

    RenameItemModal.prototype.initialize = function(uuid, type, on_success, options) {
      log_initial('(initializing) modal dialog: rename item');
      this.item_uuid = uuid;
      this.item_type = type;
      this.user_on_success = on_success;
      this.options = options;
      return RenameItemModal.__super__.initialize.apply(this, arguments);
    };

    RenameItemModal.prototype.get_item_object = function() {
      switch (this.item_type) {
        case 'datacenter':
          return datacenters.get(this.item_uuid);
        case 'table':
          return namespaces.get(this.item_uuid);
        case 'server':
          return machines.get(this.item_uuid);
        case 'database':
          return databases.get(this.item_uuid);
        default:
          return null;
      }
    };

    RenameItemModal.prototype.get_item_url = function() {
      switch (this.item_type) {
        case 'datacenter':
          return 'datacenters';
        case 'table':
          return namespaces.get(this.item_uuid).get('protocol') + '_namespaces';
        case 'server':
          return 'machines';
        case 'database':
          return 'databases';
        default:
          return null;
      }
    };

    RenameItemModal.prototype.render = function() {
      log_render('(rendering) rename item dialog');
      RenameItemModal.__super__.render.call(this, {
        type: this.item_type,
        old_name: this.get_item_object().get('name'),
        modal_title: 'Rename ' + this.item_type,
        btn_primary_text: 'Rename'
      });
      return $('#focus_new_name').focus();
    };

    RenameItemModal.prototype.on_submit = function() {
      var database, datacenter, machine, namespace, no_error, template_error, _i, _j, _k, _l, _len, _len1, _len2, _len3, _ref, _ref1, _ref2, _ref3;
      RenameItemModal.__super__.on_submit.apply(this, arguments);
      this.old_name = this.get_item_object().get('name');
      this.formdata = form_data_as_object($('form', this.$modal));
      no_error = true;
      if (this.item_type === 'namespace') {
        if (this.formdata.new_name === '') {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            namespace_is_empty: true
          }));
        } else if (/^[a-zA-Z0-9_]+$/.test(this.formdata.new_name) === false) {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            special_char_detected: true,
            type: 'table'
          }));
        } else {
          _ref = namespaces.models;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            namespace = _ref[_i];
            if (namespace.get('name') === this.formdata.new_name && namespace.get('database') === this.model.get('database')) {
              no_error = false;
              $('.alert_modal').html(this.error_template({
                namespace_exists: true
              }));
              break;
            }
          }
        }
      }
      if (this.item_type === 'database') {
        if (this.formdata.new_name === '') {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            database_is_empty: true
          }));
        } else if (/^[a-zA-Z0-9_]+$/.test(this.formdata.new_name) === false) {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            special_char_detected: true,
            type: 'database'
          }));
        } else {
          _ref1 = databases.models;
          for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
            database = _ref1[_j];
            if (database.get('name') === this.formdata.new_name) {
              no_error = false;
              $('.alert_modal').html(this.error_template({
                database_exists: true
              }));
              break;
            }
          }
        }
      }
      if (this.item_type === 'datacenter') {
        if (this.formdata.new_name === '') {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            datacenter_is_empty: true
          }));
        } else if (/^[a-zA-Z0-9_]+$/.test(this.formdata.new_name) === false) {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            special_char_detected: true,
            type: 'datacenter'
          }));
        } else {
          _ref2 = datacenters.models;
          for (_k = 0, _len2 = _ref2.length; _k < _len2; _k++) {
            datacenter = _ref2[_k];
            if (datacenter.get('name').toLowerCase() === this.formdata.new_name.toLowerCase()) {
              no_error = false;
              $('.alert_modal').html(this.error_template({
                datacenter_exists: true
              }));
              break;
            }
          }
        }
      }
      if (this.item_type === 'machine') {
        if (this.formdata.new_name === '') {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            machine_is_empty: true
          }));
        } else if (/^[a-zA-Z0-9_]+$/.test(this.formdata.new_name) === false) {
          no_error = false;
          $('.alert_modal').html(this.error_template({
            special_char_detected: true,
            type: 'server'
          }));
        } else {
          _ref3 = machines.models;
          for (_l = 0, _len3 = _ref3.length; _l < _len3; _l++) {
            machine = _ref3[_l];
            if (machine.get('name').toLowerCase() === this.formdata.new_name.toLowerCase()) {
              no_error = false;
              template_error = {
                machine_exists: true
              };
              $('.alert_modal').html(this.error_template(template_error));
              break;
            }
          }
        }
      }
      if (no_error === true) {
        return $.ajax({
          processData: false,
          url: "ajax/semilattice/" + this.get_item_url() + ("/" + this.item_uuid + "/name"),
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(this.formdata.new_name),
          success: this.on_success,
          error: this.on_error
        });
      } else {
        $('.alert_modal_content').slideDown('fast');
        return this.reset_buttons();
      }
    };

    RenameItemModal.prototype.on_success = function(response) {
      RenameItemModal.__super__.on_success.apply(this, arguments);
      this.get_item_object().set('name', this.formdata.new_name);
      if (this.options && !this.options.hide_alert) {
        $('#user-alert-space').html(this.alert_tmpl({
          type: this.item_type,
          old_name: this.old_name,
          new_name: this.formdata.new_name
        }));
      }
      if (this.user_on_success != null) {
        return this.user_on_success(response);
      }
    };

    return RenameItemModal;

  })(this.AbstractModal);
});

module('UIComponents', function() {
  this.AbstractList = (function(_super) {

    __extends(AbstractList, _super);

    function AbstractList() {
      this.destroy = __bind(this.destroy, this);

      this.get_selected_elements = __bind(this.get_selected_elements, this);

      this.remove_elements = __bind(this.remove_elements, this);

      this.add_element = __bind(this.add_element, this);

      this.reset_element_views = __bind(this.reset_element_views, this);

      this.render = __bind(this.render, this);

      this.on_remove = __bind(this.on_remove, this);

      this.on_add = __bind(this.on_add, this);

      this.on_reset = __bind(this.on_reset, this);

      this.initialize = __bind(this.initialize, this);
      return AbstractList.__super__.constructor.apply(this, arguments);
    }

    AbstractList.prototype.template = Handlebars.templates['abstract_list-template'];

    AbstractList.prototype.empty_list_template = Handlebars.templates['empty_list-template'];

    AbstractList.prototype.initialize = function(collection, element_view_class, container, options, element_name, container_name) {
      this.collection = collection;
      this.element_views = [];
      this.container = container;
      this.element_view_class = element_view_class;
      this.options = options;
      this.size = 0;
      this.element_name = element_name;
      this.container_name = container_name;
      if ((this.options != null) && (this.options.filter != null)) {
        this.filter = this.options.filter;
      } else {
        this.filter = function(model) {
          return true;
        };
      }
      if ((this.options != null) && (this.options.sort != null)) {
        this.sort = this.options.sort;
      }
      this.reset_element_views();
      this.render();
      this.collection.on('reset', this.on_reset);
      this.collection.on('add', this.on_add);
      this.collection.on('remove', this.on_remove);
      return true;
    };

    AbstractList.prototype.on_reset = function(collection) {
      this.reset_element_views();
      return this.render();
    };

    AbstractList.prototype.on_add = function(model, collection) {
      var need_to_render;
      need_to_render = false;
      if (this.filter(model)) {
        need_to_render = true;
        this.add_element(model);
      }
      if (need_to_render === true) {
        return this.render();
      }
    };

    AbstractList.prototype.on_remove = function(model, collection) {
      if (this.filter(model)) {
        this.remove_elements(model);
      }
      return this.render();
    };

    AbstractList.prototype.render = function() {
      var view, _i, _len, _ref;
      if (this.sort != null) {
        this.element_views.sort(this.sort);
      }
      this.$el.html(this.template({}));
      _ref = this.element_views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        this.$(this.container).append(view.render().$el);
      }
      if (this.element_views.length === 0 && (this.element_name != null) && (this.container_name != null)) {
        if (this.collection !== datacenters) {
          this.$(this.container).html(this.empty_list_template({
            element: this.element_name,
            container: this.container_name
          }));
        }
      }
      this.delegateEvents();
      return this;
    };

    AbstractList.prototype.reset_element_views = function() {
      var model, view, _i, _j, _len, _len1, _ref, _ref1, _results;
      _ref = this.element_views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        view.destroy();
        view.remove();
      }
      this.element_views = [];
      _ref1 = this.collection.models;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        model = _ref1[_j];
        if (this.filter(model)) {
          _results.push(this.add_element(model));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    AbstractList.prototype.add_element = function(model) {
      var element_view;
      element_view = new this.element_view_class({
        model: model,
        collection: this.collection,
        args: (this.options != null ? this.options.element_args : void 0)
      });
      this.element_views.push(element_view);
      this.size = this.element_views.length;
      this.trigger('size_changed');
      return element_view;
    };

    AbstractList.prototype.remove_elements = function(model) {
      var matching_views, view, _i, _len;
      matching_views = (function() {
        var _i, _len, _ref, _results;
        _ref = this.element_views;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          view = _ref[_i];
          if (view.model === model) {
            _results.push(view);
          }
        }
        return _results;
      }).call(this);
      for (_i = 0, _len = matching_views.length; _i < _len; _i++) {
        view = matching_views[_i];
        view.destroy();
        view.remove();
        this.element_views = _.without(this.element_views, view);
      }
      this.size = this.element_views.length;
      this.trigger('size_changed');
      return matching_views.length;
    };

    AbstractList.prototype.get_selected_elements = function() {
      var selected_elements, view, _i, _len, _ref;
      selected_elements = [];
      _ref = this.element_views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        if (view.selected) {
          selected_elements.push(view.model);
        }
      }
      return selected_elements;
    };

    AbstractList.prototype.get_callbacks = function() {
      return [];
    };

    AbstractList.prototype.destroy = function() {
      var view, _i, _len, _ref, _results;
      this.collection.off('reset', this.on_reset);
      this.collection.off('add', this.on_add);
      this.collection.off('remove', this.on_remove);
      _ref = this.element_views;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        _results.push(view.destroy());
      }
      return _results;
    };

    return AbstractList;

  })(Backbone.View);
  this.CheckboxListElement = (function(_super) {

    __extends(CheckboxListElement, _super);

    function CheckboxListElement() {
      this.mark_selection = __bind(this.mark_selection, this);

      this.link_clicked = __bind(this.link_clicked, this);

      this.clicked = __bind(this.clicked, this);

      this.json_for_template = __bind(this.json_for_template, this);

      this.render = __bind(this.render, this);
      return CheckboxListElement.__super__.constructor.apply(this, arguments);
    }

    CheckboxListElement.prototype.tagName = 'tr';

    CheckboxListElement.prototype.className = 'element';

    CheckboxListElement.prototype.events = function() {
      return {
        'click': 'clicked',
        'click a': 'link_clicked',
        'click label': 'link_clicked'
      };
    };

    CheckboxListElement.prototype.initialize = function(template) {
      this.template = template;
      return this.selected = false;
    };

    CheckboxListElement.prototype.render = function() {
      this.$el.html(this.template(this.json_for_template()));
      this.mark_selection();
      this.delegateEvents();
      return this;
    };

    CheckboxListElement.prototype.json_for_template = function() {
      return this.model.toJSON();
    };

    CheckboxListElement.prototype.clicked = function(event) {
      this.selected = !this.selected;
      this.mark_selection();
      return this.trigger('selected');
    };

    CheckboxListElement.prototype.link_clicked = function(event) {
      return event.stopPropagation();
    };

    CheckboxListElement.prototype.mark_selection = function() {
      this.$el.toggleClass('selected', this.selected);
      return this.$(':checkbox').prop('checked', this.selected);
    };

    return CheckboxListElement;

  })(Backbone.View);
  return this.CollapsibleListElement = (function(_super) {

    __extends(CollapsibleListElement, _super);

    function CollapsibleListElement() {
      this.swap_divs = __bind(this.swap_divs, this);

      this.show_with_transition = __bind(this.show_with_transition, this);

      this.show = __bind(this.show, this);

      this.toggle_showing = __bind(this.toggle_showing, this);

      this.render = __bind(this.render, this);
      return CollapsibleListElement.__super__.constructor.apply(this, arguments);
    }

    CollapsibleListElement.prototype.events = function() {
      return {
        'click .collapse-control': 'toggle_showing'
      };
    };

    CollapsibleListElement.prototype.initialize = function() {
      return this.showing = true;
    };

    CollapsibleListElement.prototype.render = function() {
      this.show();
      return this.delegateEvents();
    };

    CollapsibleListElement.prototype.toggle_showing = function(event) {
      event.preventDefault();
      this.showing = !this.showing;
      return this.show();
    };

    CollapsibleListElement.prototype.show = function() {
      this.$('.element-list-container').toggle(this.showing);
      return this.swap_divs();
    };

    CollapsibleListElement.prototype.show_with_transition = function() {
      this.$('.element-list-container').slideToggle(this.showing);
      return this.swap_divs();
    };

    CollapsibleListElement.prototype.swap_divs = function() {
      var $control, div, _i, _len, _ref, _results;
      $control = this.$('.collapse-control.collapsed, .collapse-control.expanded');
      _ref = [$control];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        div = _ref[_i];
        if (this.showing) {
          div.removeClass('collapsed').addClass('expanded');
          _results.push(div.text(div.data('expanded')));
        } else {
          div.removeClass('expanded').addClass('collapsed');
          _results.push(div.text(div.data('collapsed')));
        }
      }
      return _results;
    };

    return CollapsibleListElement;

  })(Backbone.View);
});

module('UIComponents', function() {
  return this.OperationProgressBar = (function(_super) {

    __extends(OperationProgressBar, _super);

    function OperationProgressBar() {
      this.set_none_state = __bind(this.set_none_state, this);

      this.skip_to_processing = __bind(this.skip_to_processing, this);

      this.render = __bind(this.render, this);
      return OperationProgressBar.__super__.constructor.apply(this, arguments);
    }

    OperationProgressBar.prototype.states = ['none', 'starting', 'processing', 'finished'];

    OperationProgressBar.prototype.stage = 'none';

    OperationProgressBar.prototype.initialize = function(template) {
      if (template != null) {
        this.template = template;
      } else {
        template = Handlebars.templates['progressbar-template'];
      }
      return this.timeout = null;
    };

    OperationProgressBar.prototype.render = function(current_value, max_value, additional_info) {
      var data, percent_complete,
        _this = this;
      if (current_value !== max_value && (this.timeout != null)) {
        clearTimeout(this.timeout);
        this.timeout = null;
        this.stage = 'processing';
      }
      if (this.stage === 'none' && (additional_info.new_value != null)) {
        this.stage = 'starting';
        if (this.timeout != null) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      }
      if (this.stage === 'starting' && (additional_info.got_response != null)) {
        this.stage = 'processing';
        if (this.timeout != null) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      }
      if (this.stage === 'processing' && current_value === max_value) {
        this.stage = 'finished';
        if (this.timeout != null) {
          clearTimeout(this.timeout);
          this.timeout = null;
        }
      }
      data = _.extend(additional_info, {
        current_value: current_value,
        max_value: max_value
      });
      if (this.stage === 'starting') {
        data = _.extend(data, {
          operation_active: true,
          starting: true
        });
      }
      if (this.stage === 'processing') {
        if (current_value === max_value) {
          percent_complete = 0;
        } else {
          percent_complete = Math.floor(current_value / max_value * 100);
        }
        data = _.extend(data, {
          operation_active: true,
          processing: true,
          percent_complete: percent_complete
        });
      }
      if (this.stage === 'finished') {
        data = _.extend(data, {
          operation_active: true,
          finished: true,
          percent_complete: 100
        });
        if (!(this.timeout != null)) {
          this.timeout = setTimeout(function() {
            _this.stage = 'none';
            _this.render(current_value, max_value, {});
            return _this.timeout = null;
          }, 2000);
        }
      }
      this.$el.html(this.template(data));
      return this;
    };

    OperationProgressBar.prototype.skip_to_processing = function() {
      this.stage = 'processing';
      if (this.timeout != null) {
        clearTimeout(this.timeout);
        return this.timeout = null;
      }
    };

    OperationProgressBar.prototype.set_none_state = function() {
      return this.stage = 'none';
    };

    return OperationProgressBar;

  })(Backbone.View);
});

module('DatabaseView', function() {
  this.NotFound = (function(_super) {

    __extends(NotFound, _super);

    function NotFound() {
      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return NotFound.__super__.constructor.apply(this, arguments);
    }

    NotFound.prototype.template = Handlebars.templates['element_view-not_found-template'];

    NotFound.prototype.initialize = function(id) {
      return this.id = id;
    };

    NotFound.prototype.render = function() {
      this.$el.html(this.template({
        id: this.id,
        type: 'database',
        type_url: 'databases',
        type_all_url: 'tables'
      }));
      return this;
    };

    return NotFound;

  })(Backbone.View);
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.rename_database = __bind(this.rename_database, this);

      this.render = __bind(this.render, this);

      this.check_if_still_exists = __bind(this.check_if_still_exists, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.className = 'database-view';

    Container.prototype.template = Handlebars.templates['database_view-container-template'];

    Container.prototype.alert_tmpl = Handlebars.templates['modify_shards-alert-template'];

    Container.prototype.events = function() {
      return {
        'click .close': 'close_alert',
        'click .operations .rename': 'rename_database',
        'click .operations .delete': 'delete_database'
      };
    };

    Container.prototype.initialize = function() {
      log_initial('(initializing) database view: container');
      this.title = new DatabaseView.Title({
        model: this.model
      });
      this.profile = new DatabaseView.Profile({
        model: this.model
      });
      this.namespace_list = new DatabaseView.NamespaceList({
        model: this.model
      });
      this.performance_graph = new Vis.OpsPlot(this.model.get_stats_for_performance, {
        width: 564,
        height: 210,
        seconds: 73,
        type: 'database'
      });
      return databases.on('remove', this.check_if_still_exists);
    };

    Container.prototype.check_if_still_exists = function() {
      var database, exist, _i, _len, _ref;
      exist = false;
      _ref = databases.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        database = _ref[_i];
        if (database.get('id') === this.model.get('id')) {
          exist = true;
          break;
        }
      }
      if (exist === false) {
        window.router.navigate('#tables');
        return window.app.index_namespaces({
          alert_message: "The database <a href=\"#databases/" + (this.model.get('id')) + "\">" + (this.model.get('name')) + "</a> could not be found and was probably deleted."
        });
      }
    };

    Container.prototype.render = function() {
      log_render('(rendering) database view: container');
      this.$el.html(this.template({
        database_id: this.model.get('id')
      }));
      this.$('.main_title').html(this.title.render().$el);
      this.$('.profile').html(this.profile.render().$el);
      this.$('.performance-graph').html(this.performance_graph.render().$el);
      this.$('.table-list').html(this.namespace_list.render().$el);
      return this;
    };

    Container.prototype.close_alert = function(event) {
      event.preventDefault();
      return $(event.currentTarget).parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    Container.prototype.rename_database = function(event) {
      var rename_modal;
      event.preventDefault();
      rename_modal = new UIComponents.RenameItemModal(this.model.get('id'), 'database');
      return rename_modal.render();
    };

    Container.prototype.delete_database = function(event) {
      var remove_database_dialog;
      event.preventDefault();
      remove_database_dialog = new DatabaseView.RemoveDatabaseModal;
      return remove_database_dialog.render(this.model);
    };

    Container.prototype.destroy = function() {
      databases.off('remove', this.check_if_still_exists);
      this.title.destroy();
      this.profile.destroy();
      return this.performance_graph.destroy();
    };

    return Container;

  })(Backbone.View);
  this.Title = (function(_super) {

    __extends(Title, _super);

    function Title() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.update = __bind(this.update, this);

      this.initialize = __bind(this.initialize, this);
      return Title.__super__.constructor.apply(this, arguments);
    }

    Title.prototype.className = 'database-info-view';

    Title.prototype.template = Handlebars.templates['database_view_title-template'];

    Title.prototype.initialize = function() {
      this.name = this.model.get('name');
      return this.model.on('change:name', this.update);
    };

    Title.prototype.update = function() {
      if (this.name !== this.model.get('name')) {
        this.name = this.model.get('name');
        return this.render();
      }
    };

    Title.prototype.render = function() {
      this.$el.html(this.template({
        name: this.name
      }));
      return this;
    };

    Title.prototype.destroy = function() {
      return this.model.off('change:name', this.update);
    };

    return Title;

  })(Backbone.View);
  this.Profile = (function(_super) {

    __extends(Profile, _super);

    function Profile() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Profile.__super__.constructor.apply(this, arguments);
    }

    Profile.prototype.className = 'database-profile';

    Profile.prototype.template = Handlebars.templates['database_view-profile-template'];

    Profile.prototype.initialize = function() {
      this.data = {};
      return namespaces.on('all', this.render);
    };

    Profile.prototype.render = function() {
      var data, datacenter_id, datacenters_id, datacenters_working, namespace, namespace_status, _i, _len, _ref;
      data = {
        num_namespaces: 0,
        num_live_namespaces: 0,
        reachability: true,
        nshards: 0,
        nreplicas: 0,
        ndatacenters: 0
      };
      datacenters_working = {};
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        if (namespace.get('database') === this.model.get('id')) {
          data.num_namespaces++;
          namespace_status = DataUtils.get_namespace_status(namespace.get('id'));
          if ((namespace_status != null) && namespace_status.reachability === 'Live') {
            data.num_live_namespaces++;
          }
          data.nshards += namespace_status.nshards;
          data.nreplicas += namespace_status.nreplicas;
          for (datacenter_id in namespace.get('replica_affinities')) {
            if (datacenter_id !== universe_datacenter.get('id') && (namespace.get('replica_affinities')[datacenter_id] > 0 || namespace.get('primary_uuid') === datacenter_id)) {
              datacenters_working[datacenter_id] = true;
            }
          }
        }
      }
      for (datacenters_id in datacenters_working) {
        data.ndatacenters++;
      }
      if (!_.isEqual(this.data, data)) {
        this.data = data;
        this.$el.html(this.template(data));
      }
      return this;
    };

    Profile.prototype.destroy = function() {
      return namespaces.off('all', this.render);
    };

    return Profile;

  })(Backbone.View);
  this.RemoveDatabaseModal = (function(_super) {

    __extends(RemoveDatabaseModal, _super);

    function RemoveDatabaseModal() {
      this.on_success = __bind(this.on_success, this);

      this.on_submit = __bind(this.on_submit, this);
      return RemoveDatabaseModal.__super__.constructor.apply(this, arguments);
    }

    RemoveDatabaseModal.prototype.template = Handlebars.templates['remove_database-modal-template'];

    RemoveDatabaseModal.prototype["class"] = 'remove_database-dialog';

    RemoveDatabaseModal.prototype.initialize = function() {
      return RemoveDatabaseModal.__super__.initialize.apply(this, arguments);
    };

    RemoveDatabaseModal.prototype.render = function(_database_to_delete) {
      this.database_to_delete = _database_to_delete;
      return RemoveDatabaseModal.__super__.render.call(this, {
        modal_title: 'Delete database',
        btn_primary_text: 'Delete',
        id: _database_to_delete.get('id'),
        name: _database_to_delete.get('name')
      });
    };

    RemoveDatabaseModal.prototype.on_submit = function() {
      var namespace, post_data, _i, _len, _ref;
      if (this.$('.verification_name').val() !== this.database_to_delete.get('name')) {
        if (this.$('.mismatch_container').css('display') === 'none') {
          this.$('.mismatch_container').slideDown('fast');
        } else {
          this.$('.mismatch_container').hide();
          this.$('.mismatch_container').fadeIn();
        }
        this.reset_buttons();
        return true;
      }
      RemoveDatabaseModal.__super__.on_submit.apply(this, arguments);
      post_data = {};
      post_data.databases = {};
      post_data.databases[this.database_to_delete.get('id')] = null;
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        if (namespace.get('database') === this.database_to_delete.get('id')) {
          if (!(post_data[namespace.get('protocol') + '_namespaces'] != null)) {
            post_data[namespace.get('protocol') + '_namespaces'] = {};
          }
          post_data[namespace.get('protocol') + '_namespaces'][namespace.get('id')] = null;
        }
      }
      return $.ajax({
        processData: false,
        url: 'ajax/semilattice',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(post_data),
        success: this.on_success,
        error: this.on_error
      });
    };

    RemoveDatabaseModal.prototype.on_success = function(response) {
      var id, namespace, namespace_id_to_remove, _i, _j, _len, _len1, _ref;
      window.router.navigate('#tables');
      window.app.index_namespaces({
        alert_message: "The database " + (this.database_to_delete.get('name')) + " was successfully deleted."
      });
      namespace_id_to_remove = [];
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        if (namespace.get('database') === this.database_to_delete.get('id')) {
          namespace_id_to_remove.push(namespace.get('id'));
        }
      }
      for (_j = 0, _len1 = namespace_id_to_remove.length; _j < _len1; _j++) {
        id = namespace_id_to_remove[_j];
        namespaces.remove(id);
      }
      return databases.remove(this.database_to_delete.get('id'));
    };

    return RemoveDatabaseModal;

  })(UIComponents.AbstractModal);
  return this.NamespaceList = (function(_super) {

    __extends(NamespaceList, _super);

    function NamespaceList() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return NamespaceList.__super__.constructor.apply(this, arguments);
    }

    NamespaceList.prototype.template = Handlebars.templates['database_view-namespace_list-template'];

    NamespaceList.prototype.initialize = function() {
      namespaces.on('change:shards', this.render);
      namespaces.on('change:primary_pinnings', this.render);
      namespaces.on('change:secondary_pinnings', this.render);
      namespaces.on('change:replica_affinities', this.render);
      return this.data = {};
    };

    NamespaceList.prototype.render = function() {
      var data, namespaces_in_db,
        _this = this;
      namespaces_in_db = [];
      namespaces.each(function(namespace) {
        var ns;
        if (namespace.get('database') === _this.model.get('id')) {
          ns = _.extend(DataUtils.get_namespace_status(namespace.get('id')), {
            name: namespace.get('name'),
            id: namespace.get('id')
          });
          return namespaces_in_db.push(ns);
        }
      });
      data = {
        has_tables: namespaces_in_db.length > 0,
        tables: _.sortBy(namespaces_in_db, function(namespace) {
          return namespace.name;
        })
      };
      if (!this.data !== data) {
        this.data = data;
        this.$el.html(this.template(this.data));
      }
      return this;
    };

    NamespaceList.prototype.destroy = function() {
      namespaces.off('change:shards', this.render);
      namespaces.off('change:primary_pinnings', this.render);
      namespaces.off('change:secondary_pinnings', this.render);
      return namespaces.off('change:replica_affinities', this.render);
    };

    return NamespaceList;

  })(Backbone.View);
});

module('NamespaceView', function() {
  this.DatabaseList = (function(_super) {

    __extends(DatabaseList, _super);

    function DatabaseList() {
      this.destroy = __bind(this.destroy, this);

      this.update_toolbar_buttons = __bind(this.update_toolbar_buttons, this);

      this.get_selected_namespaces = __bind(this.get_selected_namespaces, this);

      this.add_element = __bind(this.add_element, this);

      this.remove_namespace = __bind(this.remove_namespace, this);

      this.add_namespace = __bind(this.add_namespace, this);

      this.add_database = __bind(this.add_database, this);

      this.render = __bind(this.render, this);

      this.update_button_create_namespace = __bind(this.update_button_create_namespace, this);
      return DatabaseList.__super__.constructor.apply(this, arguments);
    }

    DatabaseList.prototype.template = Handlebars.templates['database_list-template'];

    DatabaseList.prototype.className = 'databases_list-container';

    DatabaseList.prototype.alert_message_template = Handlebars.templates['alert_message-template'];

    DatabaseList.prototype.events = {
      'click .add-database': 'add_database',
      'click .add-namespace': 'add_namespace',
      'click .remove-namespace': 'remove_namespace',
      'click .close': 'remove_parent_alert'
    };

    DatabaseList.prototype.initialize = function() {
      log_initial('(initializing) namespace list view');
      this.add_database_dialog = new NamespaceView.AddDatabaseModal;
      this.add_namespace_dialog = new NamespaceView.AddNamespaceModal;
      this.remove_namespace_dialog = new NamespaceView.RemoveNamespaceModal;
      DatabaseList.__super__.initialize.call(this, databases, NamespaceView.DatabaseListElement, '.collapsible-list', {}, 'database', 'cluster');
      this.datacenters_length = -1;
      this.databases_length = -1;
      datacenters.on('all', this.update_button_create_namespace);
      databases.on('all', this.update_button_create_namespace);
      return this.can_create_namespace = true;
    };

    DatabaseList.prototype.update_button_create_namespace = function() {
      if (databases.length === 0 && this.can_create_namespace === true) {
        this.$('.add-namespace').prop('disabled', 'disabled');
        return this.$('.user_alert_space-cannot_create_namespace').show();
      } else if (databases.length > 0 && this.can_create_namespace === false) {
        this.$('.add-namespace').removeProp('disabled');
        return this.$('.user_alert_space-cannot_create_namespace').hide();
      }
    };

    DatabaseList.prototype.render = function(message) {
      DatabaseList.__super__.render.apply(this, arguments);
      this.update_toolbar_buttons();
      if (message != null) {
        this.$('#user-alert-space').append(this.alert_message_template({
          message: message
        }));
      }
      this.update_button_create_namespace();
      return this;
    };

    DatabaseList.prototype.remove_parent_alert = function(event) {
      var element;
      event.preventDefault();
      element = $(event.target).parent();
      return element.slideUp('fast', function() {
        return element.remove();
      });
    };

    DatabaseList.prototype.rename_namespace = function(event) {
      var rename_modal;
      event.preventDefault();
      rename_modal = new UIComponents.RenameItemModal(this.model.get('id'), 'namespace');
      return rename_modal.render();
    };

    DatabaseList.prototype.add_database = function(event) {
      return this.add_database_dialog.render();
    };

    DatabaseList.prototype.add_namespace = function(event) {
      event.preventDefault();
      this.add_namespace_dialog.render();
      return $('#focus_namespace_name').focus();
    };

    DatabaseList.prototype.remove_namespace = function(event) {
      log_action('remove namespace button clicked');
      if (!$(event.currentTarget).is(':disabled')) {
        this.remove_namespace_dialog.render(this.get_selected_namespaces());
      }
      return event.preventDefault();
    };

    DatabaseList.prototype.add_element = function(element) {
      var namespaces_list_element;
      namespaces_list_element = DatabaseList.__super__.add_element.call(this, element);
      return namespaces_list_element.register_namespace_callback([this.update_toolbar_buttons]);
    };

    DatabaseList.prototype.get_selected_namespaces = function() {
      var namespaces_list, namespaces_lists, selected_namespaces, _i, _len;
      namespaces_lists = _.map(this.element_views, function(database_list_element) {
        return database_list_element.namespace_list;
      });
      selected_namespaces = [];
      for (_i = 0, _len = namespaces_lists.length; _i < _len; _i++) {
        namespaces_list = namespaces_lists[_i];
        selected_namespaces = selected_namespaces.concat(namespaces_list.get_selected_elements());
      }
      return selected_namespaces;
    };

    DatabaseList.prototype.update_toolbar_buttons = function() {
      if (this.get_selected_namespaces().length < 1) {
        return this.$('.btn.remove-namespace').attr('disabled', 'disabled');
      } else {
        return this.$('.btn.remove-namespace').removeAttr('disabled');
      }
    };

    DatabaseList.prototype.destroy = function() {
      DatabaseList.__super__.destroy.apply(this, arguments);
      datacenters.off('all', this.update_button_create_namespace);
      databases.off('all', this.update_button_create_namespace);
      this.add_database_dialog.destroy();
      this.add_namespace_dialog.destroy();
      return this.remove_namespace_dialog.destroy();
    };

    return DatabaseList;

  })(UIComponents.AbstractList);
  this.DatabaseListElement = (function(_super) {

    __extends(DatabaseListElement, _super);

    function DatabaseListElement() {
      this.destroy = __bind(this.destroy, this);

      this.register_namespace_callback = __bind(this.register_namespace_callback, this);

      this.remove_database = __bind(this.remove_database, this);

      this.render_summary = __bind(this.render_summary, this);

      this.render = __bind(this.render, this);
      return DatabaseListElement.__super__.constructor.apply(this, arguments);
    }

    DatabaseListElement.prototype.template = Handlebars.templates['database_list_element-template'];

    DatabaseListElement.prototype.summary_template = Handlebars.templates['database_list_element-summary-template'];

    DatabaseListElement.prototype.className = 'element-container';

    DatabaseListElement.prototype.events = function() {
      return _.extend(DatabaseListElement.__super__.events.apply(this, arguments), {
        'click button.remove-database': 'remove_database'
      });
    };

    DatabaseListElement.prototype.initialize = function() {
      DatabaseListElement.__super__.initialize.apply(this, arguments);
      this.delegateEvents();
      this.namespace_list = new NamespaceView.NamespaceList(this.model.get('id'));
      this.callbacks = [];
      this.no_namespace = true;
      this.model.on('change', this.render_summary);
      return this.namespace_list.on('size_changed', this.render);
    };

    DatabaseListElement.prototype.render = function() {
      this.$el.html(this.template({}));
      this.render_summary();
      this.$('.element-list-container').html(this.namespace_list.render().$el);
      DatabaseListElement.__super__.render.apply(this, arguments);
      return this;
    };

    DatabaseListElement.prototype.render_summary = function() {
      var json;
      json = this.model.toJSON();
      return this.$('.summary').html(this.summary_template(json));
    };

    DatabaseListElement.prototype.remove_database = function(event) {
      var db, remove_database_dialog;
      event.preventDefault();
      db = databases.get(this.$(event.target).data('id'));
      if (db != null) {
        remove_database_dialog = new DatabaseView.RemoveDatabaseModal;
        return remove_database_dialog.render(db);
      }
    };

    DatabaseListElement.prototype.register_namespace_callback = function(callbacks) {
      this.callbacks = callbacks;
      return this.namespace_list.register_namespace_callbacks(this.callbacks);
    };

    DatabaseListElement.prototype.rename_datacenter = function(event) {
      var rename_modal;
      event.preventDefault();
      rename_modal = new UIComponents.RenameItemModal(this.model.get('id'), 'datacenter');
      return rename_modal.render();
    };

    DatabaseListElement.prototype.destroy = function() {
      this.model.off('change', this.render_summary);
      this.namespace_list.off('size_changed', this.nl_size_changed);
      return this.namespace_list.destroy();
    };

    return DatabaseListElement;

  })(UIComponents.CollapsibleListElement);
  this.NamespaceList = (function(_super) {

    __extends(NamespaceList, _super);

    function NamespaceList() {
      this.destroy = __bind(this.destroy, this);

      this.bind_callbacks_to_namespace = __bind(this.bind_callbacks_to_namespace, this);

      this.register_namespace_callbacks = __bind(this.register_namespace_callbacks, this);

      this.remove_namespace = __bind(this.remove_namespace, this);

      this.add_namespace = __bind(this.add_namespace, this);

      this.add_element = __bind(this.add_element, this);

      this.initialize = __bind(this.initialize, this);
      return NamespaceList.__super__.constructor.apply(this, arguments);
    }

    NamespaceList.prototype.tagName = 'div';

    NamespaceList.prototype.template = Handlebars.templates['namespace_list-template'];

    NamespaceList.prototype.initialize = function(database_id) {
      log_initial('(initializing) namespace list view');
      return NamespaceList.__super__.initialize.call(this, namespaces, NamespaceView.NamespaceListElement, '.list', {
        filter: function(model) {
          return model.get('database') === database_id;
        }
      }, 'table', 'database');
    };

    NamespaceList.prototype.add_element = function(element) {
      var namespace_list_element;
      namespace_list_element = NamespaceList.__super__.add_element.call(this, element);
      return this.bind_callbacks_to_namespace(namespace_list_element);
    };

    NamespaceList.prototype.add_namespace = function(event) {
      event.preventDefault();
      this.add_namespace_dialog.render();
      return $('#focus_namespace_name').focus();
    };

    NamespaceList.prototype.remove_namespace = function(event) {
      log_action('remove namespace button clicked');
      if (!$(event.currentTarget).is(':disabled')) {
        this.remove_namespace_dialog.render(this.get_selected_elements());
      }
      return event.preventDefault();
    };

    NamespaceList.prototype.register_namespace_callbacks = function(callbacks) {
      var namespace_list_element, _i, _len, _ref, _results;
      this.callbacks = callbacks;
      _ref = this.element_views;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace_list_element = _ref[_i];
        _results.push(this.bind_callbacks_to_namespace(namespace_list_element));
      }
      return _results;
    };

    NamespaceList.prototype.bind_callbacks_to_namespace = function(namespace_list_element) {
      var _this = this;
      namespace_list_element.off('selected');
      return namespace_list_element.on('selected', function() {
        var callback, _i, _len, _ref, _results;
        _ref = _this.callbacks;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          callback = _ref[_i];
          _results.push(callback());
        }
        return _results;
      });
    };

    NamespaceList.prototype.destroy = function() {
      return NamespaceList.__super__.destroy.call(this);
    };

    return NamespaceList;

  })(UIComponents.AbstractList);
  this.NamespaceListElement = (function(_super) {

    __extends(NamespaceListElement, _super);

    function NamespaceListElement() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.json_for_template = __bind(this.json_for_template, this);
      return NamespaceListElement.__super__.constructor.apply(this, arguments);
    }

    NamespaceListElement.prototype.template = Handlebars.templates['namespace_list_element-template'];

    NamespaceListElement.prototype.tagName = 'div';

    NamespaceListElement.prototype.hide_popover = function() {
      return $('.tooltip').remove();
    };

    NamespaceListElement.prototype.initialize = function() {
      log_initial('(initializing) list view: namespace');
      return NamespaceListElement.__super__.initialize.call(this, this.template);
    };

    NamespaceListElement.prototype.json_for_template = function() {
      var json;
      json = _.extend(NamespaceListElement.__super__.json_for_template.call(this), DataUtils.get_namespace_status(this.model.get('id')));
      return json;
    };

    NamespaceListElement.prototype.render = function() {
      NamespaceListElement.__super__.render.apply(this, arguments);
      return this;
    };

    NamespaceListElement.prototype.destroy = function() {
      return NamespaceListElement.__super__.destroy.apply(this, arguments);
    };

    return NamespaceListElement;

  })(UIComponents.CheckboxListElement);
  this.AddDatabaseModal = (function(_super) {

    __extends(AddDatabaseModal, _super);

    function AddDatabaseModal() {
      this.on_success = __bind(this.on_success, this);
      return AddDatabaseModal.__super__.constructor.apply(this, arguments);
    }

    AddDatabaseModal.prototype.template = Handlebars.templates['add_database-modal-template'];

    AddDatabaseModal.prototype.alert_tmpl = Handlebars.templates['added_database-alert-template'];

    AddDatabaseModal.prototype.error_template = Handlebars.templates['error_input-template'];

    AddDatabaseModal.prototype["class"] = 'add-database';

    AddDatabaseModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: add datacenter');
      return AddDatabaseModal.__super__.initialize.apply(this, arguments);
    };

    AddDatabaseModal.prototype.render = function() {
      log_render('(rendering) add datatabase dialog');
      AddDatabaseModal.__super__.render.call(this, {
        modal_title: "Add database",
        btn_primary_text: "Add"
      });
      return this.$('.focus_new_name').focus();
    };

    AddDatabaseModal.prototype.on_submit = function() {
      var database, no_error, _i, _len, _ref;
      AddDatabaseModal.__super__.on_submit.apply(this, arguments);
      this.formdata = form_data_as_object($('form', this.$modal));
      no_error = true;
      if (this.formdata.name === '') {
        no_error = false;
        $('.alert_modal').html(this.error_template({
          database_is_empty: true
        }));
      } else if (/^[a-zA-Z0-9_]+$/.test(this.formdata.name) === false) {
        no_error = false;
        $('.alert_modal').html(this.error_template({
          special_char_detected: true,
          type: 'database'
        }));
      } else {
        _ref = databases.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          database = _ref[_i];
          if (database.get('name') === this.formdata.name) {
            no_error = false;
            $('.alert_modal').html(this.error_template({
              database_exists: true
            }));
            break;
          }
        }
      }
      if (no_error === true) {
        return $.ajax({
          processData: false,
          url: 'ajax/semilattice/databases/new',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            "name": this.formdata.name
          }),
          success: this.on_success,
          error: this.on_error
        });
      } else {
        $('.alert_modal_content').slideDown('fast');
        return this.reset_buttons();
      }
    };

    AddDatabaseModal.prototype.on_success = function(response) {
      var id, namespace, _results;
      AddDatabaseModal.__super__.on_success.apply(this, arguments);
      apply_to_collection(databases, response);
      _results = [];
      for (id in response) {
        namespace = response[id];
        _results.push($('#user-alert-space').append(this.alert_tmpl({
          name: namespace.name,
          id: id
        })));
      }
      return _results;
    };

    return AddDatabaseModal;

  })(UIComponents.AbstractModal);
  this.AddNamespaceModal = (function(_super) {

    __extends(AddNamespaceModal, _super);

    function AddNamespaceModal() {
      this.on_success = __bind(this.on_success, this);

      this.on_submit = __bind(this.on_submit, this);

      this.check_if_can_create_table = __bind(this.check_if_can_create_table, this);

      this.hide_advanced_settings = __bind(this.hide_advanced_settings, this);

      this.show_advanced_settings = __bind(this.show_advanced_settings, this);

      this.initialize = __bind(this.initialize, this);
      return AddNamespaceModal.__super__.constructor.apply(this, arguments);
    }

    AddNamespaceModal.prototype.template = Handlebars.templates['add_namespace-modal-template'];

    AddNamespaceModal.prototype.alert_tmpl = Handlebars.templates['added_namespace-alert-template'];

    AddNamespaceModal.prototype.need_database_alert_template = Handlebars.templates['need_database-alert-template'];

    AddNamespaceModal.prototype.error_template = Handlebars.templates['error_input-template'];

    AddNamespaceModal.prototype["class"] = 'add-namespace';

    AddNamespaceModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: add namespace');
      AddNamespaceModal.__super__.initialize.apply(this, arguments);
      databases.on('add', this.check_if_can_create_table);
      databases.on('remove', this.check_if_can_create_table);
      databases.on('reset', this.check_if_can_create_table);
      this.can_create_table_status = true;
      return this.delegateEvents();
    };

    AddNamespaceModal.prototype.show_advanced_settings = function(event) {
      var that;
      event.preventDefault();
      that = this;
      this.$('.show_advanced_settings-link_container').fadeOut('fast', function() {
        return that.$('.hide_advanced_settings-link_container').fadeIn('fast');
      });
      return this.$('.advanced_settings').slideDown('fast');
    };

    AddNamespaceModal.prototype.hide_advanced_settings = function(event) {
      var that;
      event.preventDefault();
      that = this;
      this.$('.hide_advanced_settings-link_container').fadeOut('fast', function() {
        return that.$('.show_advanced_settings-link_container').fadeIn('fast');
      });
      return this.$('.advanced_settings').slideUp('fast');
    };

    AddNamespaceModal.prototype.check_if_can_create_table = function() {
      if (databases.length === 0) {
        if (this.can_create_table_status) {
          this.$('.btn-primary').prop('disabled', 'disabled');
          return this.$('.alert_modal').html('You need to create a database before creating a table.');
        }
      } else {
        if (this.can_create_table_status === false) {
          this.$('.alert_modal').empty();
          return this.$('.btn-primary').removeProp('disabled');
        }
      }
    };

    AddNamespaceModal.prototype.render = function() {
      var datacenter, machine, ordered_datacenters, slice_index, _i, _j, _k, _len, _len1, _len2, _ref, _ref1;
      log_render('(rendering) add namespace dialog');
      _ref = datacenters.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        datacenter = _ref[_i];
        datacenter.set('num_machines', 0);
      }
      _ref1 = machines.models;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        machine = _ref1[_j];
        if (machine.get('datacenter_uuid') !== universe_datacenter.get('id')) {
          datacenters.get(machine.get('datacenter_uuid')).set('num_machines', datacenter.get('num_machines') + 1);
        }
      }
      ordered_datacenters = _.map(datacenters.models, function(datacenter) {
        return {
          id: datacenter.get('id'),
          name: datacenter.get('name'),
          num_machines: datacenter.get('num_machines')
        };
      });
      ordered_datacenters = ordered_datacenters.sort(function(a, b) {
        return b.num_machines - a.num_machines;
      });
      slice_index = 0;
      for (_k = 0, _len2 = ordered_datacenters.length; _k < _len2; _k++) {
        datacenter = ordered_datacenters[_k];
        if (datacenter.num_machines === 0) {
          break;
        }
        slice_index++;
      }
      ordered_datacenters = ordered_datacenters.slice(0, slice_index);
      ordered_datacenters.unshift({
        id: universe_datacenter.get('id'),
        name: universe_datacenter.get('name')
      });
      AddNamespaceModal.__super__.render.call(this, {
        modal_title: 'Add table',
        btn_primary_text: 'Add',
        datacenters: ordered_datacenters,
        all_datacenters: datacenters.length === ordered_datacenters.length,
        databases: _.map(databases.models, function(database) {
          return database.toJSON();
        })
      });
      this.check_if_can_create_table();
      this.$('.show_advanced_settings-link').click(this.show_advanced_settings);
      return this.$('.hide_advanced_settings-link').click(this.hide_advanced_settings);
    };

    AddNamespaceModal.prototype.on_submit = function() {
      var ack, cache_size_int, formdata, input_error, namespace, template_error, _i, _len, _ref;
      AddNamespaceModal.__super__.on_submit.apply(this, arguments);
      formdata = form_data_as_object($('form', this.$modal));
      template_error = {};
      input_error = false;
      if (formdata.name === '') {
        input_error = true;
        template_error.namespace_is_empty = true;
      } else if (/^[a-zA-Z0-9_]+$/.test(formdata.name) === false) {
        input_error = true;
        template_error.special_char_detected = true;
        template_error.type = 'table';
      } else {
        _ref = namespaces.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          namespace = _ref[_i];
          if (namespace.get('name') === formdata.name && namespace.get('database') === formdata.database) {
            input_error = true;
            template_error.namespace_exists = true;
            break;
          }
        }
      }
      if (!(formdata.database != null) || formdata.database === '') {
        input_error = true;
        template_error.no_database = true;
      }
      if (formdata.cache_size !== '' && DataUtils.is_integer(formdata.cache_size) === false) {
        input_error = true;
        template_error.cache_size_format = true;
      } else if (formdata.cache_size !== '') {
        cache_size_int = parseInt(formdata.cache_size);
        if (cache_size_int < 16) {
          input_error = true;
          template_error.cache_size_too_small = true;
        } else if (cache_size_int > 1024 * 64) {
          input_error = true;
          template_error.cache_size_too_big = true;
        }
      }
      if (input_error === true) {
        $('.alert_modal').html(this.error_template(template_error));
        $('.alert_modal_content').slideDown('fast');
        return this.reset_buttons();
      } else {
        ack = {};
        ack[universe_datacenter.get('id')] = {
          expectation: 1,
          hard_durability: formdata.write_disk === 'yes' ? true : false
        };
        return $.ajax({
          processData: false,
          url: 'ajax/semilattice/rdb_namespaces/new',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            name: formdata.name,
            primary_uuid: universe_datacenter.get('id'),
            database: formdata.database,
            ack_expectations: ack,
            cache_size: (formdata.cache_size !== '' ? parseInt(formdata.cache_size) * 1024 * 1024 : void 0),
            primary_key: (formdata.primary_key !== '' ? formdata.primary_key : void 0)
          }),
          success: this.on_success,
          error: this.on_error
        });
      }
    };

    AddNamespaceModal.prototype.on_success = function(response) {
      var id, namespace, _results;
      AddNamespaceModal.__super__.on_success.apply(this, arguments);
      apply_to_collection(namespaces, add_protocol_tag(response, "rdb"));
      _results = [];
      for (id in response) {
        namespace = response[id];
        _results.push($('#user-alert-space').append(this.alert_tmpl({
          uuid: id,
          name: namespace.name
        })));
      }
      return _results;
    };

    return AddNamespaceModal;

  })(UIComponents.AbstractModal);
  return this.RemoveNamespaceModal = (function(_super) {

    __extends(RemoveNamespaceModal, _super);

    function RemoveNamespaceModal() {
      this.ton_error = __bind(this.ton_error, this);
      return RemoveNamespaceModal.__super__.constructor.apply(this, arguments);
    }

    RemoveNamespaceModal.prototype.template = Handlebars.templates['remove_namespace-modal-template'];

    RemoveNamespaceModal.prototype.alert_tmpl = Handlebars.templates['removed_namespace-alert-template'];

    RemoveNamespaceModal.prototype["class"] = 'remove-namespace-dialog';

    RemoveNamespaceModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: remove namespace');
      return RemoveNamespaceModal.__super__.initialize.apply(this, arguments);
    };

    RemoveNamespaceModal.prototype.render = function(_namespaces_to_delete) {
      var array_for_template;
      log_render('(rendering) remove namespace dialog');
      this.namespaces_to_delete = _namespaces_to_delete;
      array_for_template = _.map(this.namespaces_to_delete, function(namespace) {
        return namespace.toJSON();
      });
      RemoveNamespaceModal.__super__.render.call(this, {
        modal_title: 'Delete tables',
        btn_primary_text: 'Delete',
        namespaces: array_for_template
      });
      return this.$('.btn-primary').focus();
    };

    RemoveNamespaceModal.prototype.on_submit = function() {
      var data, namespace, _i, _len, _ref;
      RemoveNamespaceModal.__super__.on_submit.apply(this, arguments);
      data = {};
      _ref = this.namespaces_to_delete;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        if (!(data[namespace.get('protocol') + '_namespaces'] != null)) {
          data[namespace.get('protocol') + '_namespaces'] = {};
        }
        data[namespace.get('protocol') + '_namespaces'][namespace.get('id')] = null;
      }
      return $.ajax({
        url: "ajax/semilattice",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        dataType: 'json',
        success: this.on_success,
        error: this.on_error
      });
    };

    RemoveNamespaceModal.prototype.on_success = function(response) {
      var deleted_namespaces, namespace, _i, _len, _ref;
      deleted_namespaces = [];
      _ref = this.namespaces_to_delete;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        deleted_namespaces.push(namespaces.get(namespace.id).get('name'));
      }
      $('#user-alert-space').append(this.alert_tmpl({
        deleted_namespaces: deleted_namespaces,
        num_deleted_namespaces: deleted_namespaces.length
      }));
      apply_diffs(response);
      return RemoveNamespaceModal.__super__.on_success.apply(this, arguments);
    };

    RemoveNamespaceModal.prototype.ton_error = function() {
      this.$('.error_answer').html(this.template_remove_error);
      if ($('.error_answer').css('display') === 'none') {
        $('.error_answer').slideDown('fast');
      } else {
        $('.error_answer').css('display', 'none');
        $('.error_answer').fadeIn();
      }
      return remove_namespace_dialog.reset_buttons();
    };

    return RemoveNamespaceModal;

  })(UIComponents.AbstractModal);
});

module('NamespaceView', function() {
  this.Replicas = (function(_super) {

    __extends(Replicas, _super);

    function Replicas() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.render_universe = __bind(this.render_universe, this);

      this.toggle_mdc = __bind(this.toggle_mdc, this);

      this.render_acks_greater_than_replicas = __bind(this.render_acks_greater_than_replicas, this);

      this.render_primary_not_found = __bind(this.render_primary_not_found, this);

      this.render_datacenter = __bind(this.render_datacenter, this);

      this.handle_click_datacenter = __bind(this.handle_click_datacenter, this);

      this.render_list = __bind(this.render_list, this);

      this.render_status = __bind(this.render_status, this);

      this.render_progress = __bind(this.render_progress, this);

      this.render_progress_server_update = __bind(this.render_progress_server_update, this);

      this.global_trigger_for_replica = __bind(this.global_trigger_for_replica, this);

      this.initialize = __bind(this.initialize, this);
      return Replicas.__super__.constructor.apply(this, arguments);
    }

    Replicas.prototype.className = 'namespace-replicas';

    Replicas.prototype.template = Handlebars.templates['namespace_view-replica-template'];

    Replicas.prototype.no_datacenter_template = Handlebars.templates['namespace_view-replica-no_datacenter-template'];

    Replicas.prototype.datacenter_list_template = Handlebars.templates['namespace_view-replica-datacenters_list-template'];

    Replicas.prototype.acks_greater_than_replicas_template = Handlebars.templates['namespace_view-acks_greater_than_replicas-template'];

    Replicas.prototype.replica_status_template = Handlebars.templates['replica_status-template'];

    Replicas.prototype.events = {
      'click .nav_datacenter': 'handle_click_datacenter',
      'click .toggle-mdc': 'toggle_mdc'
    };

    Replicas.prototype.initialize = function() {
      var datacenter_id, num_replicas, num_shards;
      this.progress_bar = new UIComponents.OperationProgressBar(this.replica_status_template);
      datacenters.on('add', this.render_list);
      datacenters.on('remove', this.render_list);
      datacenters.on('reset', this.render_list);
      this.model.on('change:primary_uuid', this.render_primary_not_found);
      this.model.on('change:replica_affinities', this.global_trigger_for_replica);
      this.model.on('change:ack_expectations', this.render_acks_greater_than_replicas);
      this.model.on('change:shards', this.render_progress_server_update);
      progress_list.on('all', this.render_progress);
      directory.on('all', this.render_status);
      num_shards = this.model.get('shards').length;
      num_replicas = 1;
      for (datacenter_id in this.model.get('replica_affinities')) {
        num_replicas += this.model.get('replica_affinities')[datacenter_id];
      }
      this.expected_num_replicas = num_replicas * num_shards;
      this.universe_replicas = new NamespaceView.DatacenterReplicas(universe_datacenter.get('id'), this.model);
      return this.primary_datacenter = new NamespaceView.PrimaryDatacenter({
        model: this.model
      });
    };

    Replicas.prototype.global_trigger_for_replica = function() {
      this.render_acks_greater_than_replicas();
      return this.render_progress_server_update();
    };

    Replicas.prototype.render_progress_server_update = function() {
      var datacenter_id, new_replicas, replicas_length, shards_length;
      this.progress_bar.skip_to_processing();
      new_replicas = this.model.get('replica_affinities');
      replicas_length = 1;
      for (datacenter_id in new_replicas) {
        replicas_length += new_replicas[datacenter_id];
      }
      shards_length = this.model.get('shards').length;
      return this.render_status({
        got_response: true,
        replicas_length: replicas_length,
        shards_length: shards_length
      });
    };

    Replicas.prototype.render_progress = function() {
      return this.render_status({
        backfilling_updated: true
      });
    };

    Replicas.prototype.render_status = function(progress_bar_info) {
      var activities, activity, activity_id, backfilling_info, blueprint, expected_num_replicas, expected_status, found_shard, machine_id, num_replicas, num_replicas_not_ready, num_replicas_ready, role, shard, shard_ready, _ref, _ref1, _ref2;
      if (!(progress_bar_info != null) || typeof progress_bar_info !== 'object') {
        progress_bar_info = {};
      }
      blueprint = this.model.get('blueprint').peers_roles;
      if (!(blueprint != null)) {
        return '';
      }
      num_replicas_not_ready = 0;
      num_replicas_ready = 0;
      for (machine_id in blueprint) {
        for (shard in blueprint[machine_id]) {
          found_shard = false;
          shard_ready = true;
          role = blueprint[machine_id][shard];
          if (role === 'role_nothing') {
            continue;
          }
          if (role === 'role_primary') {
            expected_status = 'primary';
          } else if (role === 'role_secondary') {
            expected_status = 'secondary_up_to_date';
          }
          activities = (_ref = directory.get(machine_id)) != null ? (_ref1 = _ref.get(this.model.get('protocol') + '_namespaces')) != null ? (_ref2 = _ref1['reactor_bcards'][this.model.get('id')]) != null ? _ref2['activity_map'] : void 0 : void 0 : void 0;
          if (activities != null) {
            for (activity_id in activities) {
              activity = activities[activity_id];
              if (activity[0] === shard) {
                found_shard = true;
                if (activity[1]['type'] !== expected_status) {
                  shard_ready = false;
                  break;
                }
              }
            }
          }
          if (found_shard === false || shard_ready === false) {
            num_replicas_not_ready++;
          } else {
            num_replicas_ready++;
          }
        }
      }
      num_replicas = num_replicas_ready + num_replicas_not_ready;
      if ((progress_bar_info != null ? progress_bar_info.new_value : void 0) != null) {
        this.$('.replica-status').html(this.progress_bar.render(0, expected_num_replicas, progress_bar_info).$el);
        this.expected_num_replicas = progress_bar_info.new_value;
      } else if ((progress_bar_info != null ? progress_bar_info.got_response : void 0) === true) {
        expected_num_replicas = progress_bar_info.replicas_length * progress_bar_info.shards_length;
        this.$('.replica-status').html(this.progress_bar.render(0, expected_num_replicas, progress_bar_info).$el);
        this.expected_num_replicas = expected_num_replicas;
      } else if ((progress_bar_info != null ? progress_bar_info.backfilling_updated : void 0) === true) {
        if (num_replicas_ready + num_replicas_not_ready === this.expected_num_replicas) {
          backfilling_info = DataUtils.get_backfill_progress_agg(this.model.get('id'));
          if (backfilling_info === null || backfilling_info.total_blocks === -1) {
            if (num_replicas_not_ready === 0) {
              this.$('.replica-status').html(this.progress_bar.render(num_replicas_ready, num_replicas_ready, progress_bar_info).$el);
            } else {
              this.$('.replica-status').html(this.progress_bar.render(num_replicas_ready, num_replicas_ready + num_replicas_not_ready, progress_bar_info).$el);
            }
          } else {
            progress_bar_info = _.extend(progress_bar_info, {
              total_blocks: backfilling_info.total_blocks,
              replicated_blocks: backfilling_info.replicated_blocks > backfilling_info.replicated_blocks ? backfilling_info.total_blocks : backfilling_info.replicated_blocks
            });
            this.$('.replica-status').html(this.progress_bar.render(num_replicas_ready, num_replicas_ready + num_replicas_not_ready, progress_bar_info).$el);
          }
        } else {
          this.$('.replica-status').html(this.progress_bar.render(0, this.expected_num_replicas, {}).$el);
        }
      } else {
        if (num_replicas_ready + num_replicas_not_ready === this.expected_num_replicas) {
          this.$('.replica-status').html(this.progress_bar.render(num_replicas_ready, num_replicas_ready + num_replicas_not_ready, progress_bar_info).$el);
        } else {
          this.$('.replica-status').html(this.progress_bar.render(0, this.expected_num_replicas, {}).$el);
        }
      }
      return this;
    };

    Replicas.prototype.render_list = function() {
      var datacenter, found_active, i, that, _i, _j, _len, _len1, _ref, _ref1;
      that = this;
      this.ordered_datacenters = _.map(datacenters.models, function(datacenter) {
        return {
          id: datacenter.get('id'),
          name: datacenter.get('name').length > 8 ? datacenter.get('name').slice(0, 8) + '...' : datacenter.get('name'),
          namespace_id: that.model.get('id')
        };
      });
      this.ordered_datacenters = this.ordered_datacenters.sort(function(a, b) {
        if (a.name > b.name) {
          return 1;
        } else if (a.name < b.name) {
          return -1;
        } else {
          return 0;
        }
      });
      found_active = false;
      if (this.active_datacenter_id != null) {
        _ref = this.ordered_datacenters;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          datacenter = _ref[i];
          if (datacenter.id === this.active_datacenter_id) {
            datacenter.active = true;
            found_active = true;
            break;
          }
        }
      }
      if (found_active === false) {
        if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
          if (this.ordered_datacenters.length > 0) {
            this.ordered_datacenters[0].active = true;
            this.active_datacenter_id = this.ordered_datacenters[0].id;
            found_active = true;
          }
        } else {
          _ref1 = this.ordered_datacenters;
          for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
            datacenter = _ref1[i];
            if (datacenter.id === this.model.get('primary_uuid') && (datacenters.get(datacenter.id) != null)) {
              datacenter.active = true;
              this.active_datacenter_id = datacenter.id;
              found_active = true;
              break;
            }
          }
        }
      }
      if (found_active === false) {
        if (this.ordered_datacenters.length > 0) {
          this.ordered_datacenters[0].active = true;
          this.active_datacenter_id = this.ordered_datacenters[0].id;
        }
      }
      this.$('.datacenters_list_container').html(this.datacenter_list_template({
        id: this.model.get('id'),
        datacenters: this.ordered_datacenters
      }));
      if (!(this.datacenter_view != null) && (this.active_datacenter_id != null)) {
        this.render_datacenter(this.active_datacenter_id);
      }
      if (this.ordered_datacenters.length === 0) {
        if (this.datacenter_view != null) {
          this.datacenter_view.destroy();
        }
        this.datacenter_view = null;
        this.$('.datacenter_content').html(this.no_datacenter_template());
      }
      if (this.ordered_datacenters.length === 0) {
        return this.$('.primary-dc').hide();
      } else {
        return this.$('.primary-dc').show();
      }
    };

    Replicas.prototype.handle_click_datacenter = function(event) {
      event.preventDefault();
      this.render_datacenter(this.$(event.target).data('datacenter_id'));
      this.$('.datacenter_tab').removeClass('active');
      return this.$(event.target).parent().addClass('active');
    };

    Replicas.prototype.render_datacenter = function(datacenter_id) {
      this.active_datacenter_id = datacenter_id;
      this.datacenter_id_shown = datacenter_id;
      if (this.datacenter_view != null) {
        this.datacenter_view.destroy();
      }
      this.datacenter_view = new NamespaceView.DatacenterReplicas(this.datacenter_id_shown, this.model);
      return this.$('.datacenter_content').html(this.datacenter_view.render().$el);
    };

    Replicas.prototype.render_primary_not_found = function() {
      if (this.model.get('primary_uuid') !== universe_datacenter.get('id') && !(datacenters.get(this.model.get('primary_uuid')) != null)) {
        if (this.$('.no_datacenter_found').css('display') === 'none' || this.$('.no_datacenter_found').css('display') === 'hidden' || this.$('.no_datacenter_found').css('display') === '') {
          return this.$('.no_datacenter_found').show();
        }
      } else {
        if (this.$('.no_datacenter_found').css('display') === 'block') {
          return this.$('.no_datacenter_found').hide();
        }
      }
    };

    Replicas.prototype.render_acks_greater_than_replicas = function() {
      var datacenter_id, datacenter_name, datacenters_with_issues, replicas_value;
      datacenters_with_issues = [];
      for (datacenter_id in this.model.get('ack_expectations')) {
        if ((datacenters.get(datacenter_id) != null) || datacenter_id === universe_datacenter.get('id')) {
          replicas_value = 0;
          if (this.model.get('replica_affinities')[datacenter_id] != null) {
            replicas_value = this.model.get('replica_affinities')[datacenter_id];
          }
          if (this.model.get('primary_uuid') === datacenter_id) {
            replicas_value++;
          }
          if (replicas_value < this.model.get('ack_expectations')[datacenter_id].expectation) {
            if (datacenters.get(datacenter_id) != null) {
              datacenter_name = datacenters.get(datacenter_id).get('name');
            } else if (datacenter_id === universe_datacenter.get('id')) {
              datacenter_name = universe_datacenter.get('name');
            }
            datacenters_with_issues.push({
              id: datacenter_id,
              name: datacenter_name
            });
          }
        }
      }
      if (datacenters_with_issues.length > 0) {
        if (this.$('.ack_greater_than_replicas').css('display') === 'none' || this.$('.no_datacenter_found').css('display') === 'hidden' || this.$('.no_datacenter_found').css('display') === '') {
          this.$('.ack_greater_than_replicas').html(this.acks_greater_than_replicas_template({
            num_datacenters_with_issues: datacenters_with_issues.length,
            datacenters_with_issues: datacenters_with_issues
          }));
          return this.$('.ack_greater_than_replicas').show();
        }
      } else {
        if (this.$('.ack_greater_than_replicas').css('display') === 'block') {
          return this.$('.ack_greater_than_replicas').hide();
        }
      }
    };

    Replicas.prototype.toggle_mdc = function(event) {
      event.preventDefault();
      this.$('.mdc-options').toggleClass('hidden');
      return this.$('.show-mdc, .hide-mdc').toggle();
    };

    Replicas.prototype.render_universe = function() {
      return this.$('.cluster_container').html(this.universe_replicas.render().$el);
    };

    Replicas.prototype.render = function() {
      this.$el.html(this.template());
      this.render_list();
      this.render_primary_not_found();
      this.render_acks_greater_than_replicas();
      this.render_universe();
      this.render_status();
      this.$('.primary-dc').html(this.primary_datacenter.render().$el);
      if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
        if (this.ordered_datacenters.length > 0) {
          this.datacenter_picked = this.ordered_datacenters[0];
          this.render_datacenter(this.datacenter_picked.id);
        } else {
          this.datacenter_view = null;
          this.$('.datacenter_content').html(this.no_datacenter_template());
        }
      } else {
        this.render_datacenter(this.model.get('primary_uuid'));
      }
      return this;
    };

    Replicas.prototype.destroy = function() {
      if (this.datacenter_view) {
        this.datacenter_view.destroy();
      }
      datacenters.off('add', this.render_list);
      datacenters.off('remove', this.render_list);
      datacenters.off('reset', this.render_list);
      this.model.off('change:primary_uuid', this.render_primary_not_found);
      this.model.off('change:replica_affinities', this.render_acks_greater_than_replicas);
      this.model.off('change:ack_expectations', this.render_acks_greater_than_replicas);
      this.model.on('change:shards', this.render_progress_server_update);
      progress_list.on('all', this.render_progress);
      return directory.on('all', this.render_status);
    };

    return Replicas;

  })(Backbone.View);
  this.DatacenterReplicas = (function(_super) {

    __extends(DatacenterReplicas, _super);

    function DatacenterReplicas() {
      this.destroy = __bind(this.destroy, this);

      this.on_success = __bind(this.on_success, this);

      this.make_primary = __bind(this.make_primary, this);

      this.on_error = __bind(this.on_error, this);

      this.on_success_replicas_and_acks = __bind(this.on_success_replicas_and_acks, this);

      this.submit_replicas_acks = __bind(this.submit_replicas_acks, this);

      this.check_replicas_acks = __bind(this.check_replicas_acks, this);

      this.remove_alert_replicas_acks = __bind(this.remove_alert_replicas_acks, this);

      this.alert_replicas_acks = __bind(this.alert_replicas_acks, this);

      this.compute_max_machines = __bind(this.compute_max_machines, this);

      this.render = __bind(this.render, this);

      this.render_progress = __bind(this.render_progress, this);

      this.render_acks_replica = __bind(this.render_acks_replica, this);

      this.cancel_edit = __bind(this.cancel_edit, this);

      this.edit = __bind(this.edit, this);

      this.initialize = __bind(this.initialize, this);

      this.keypress_replicas_acks = __bind(this.keypress_replicas_acks, this);
      return DatacenterReplicas.__super__.constructor.apply(this, arguments);
    }

    DatacenterReplicas.prototype.className = 'datacenter_view';

    DatacenterReplicas.prototype.template = Handlebars.templates['namespace_view-datacenter_replica-template'];

    DatacenterReplicas.prototype.universe_template = Handlebars.templates['namespace_view-universe_replica-template'];

    DatacenterReplicas.prototype.edit_template = Handlebars.templates['namespace_view-edit_datacenter_replica-template'];

    DatacenterReplicas.prototype.error_template = Handlebars.templates['namespace_view-edit_datacenter_replica-error-template'];

    DatacenterReplicas.prototype.error_msg_template = Handlebars.templates['namespace_view-edit_datacenter_replica-alert_messages-template'];

    DatacenterReplicas.prototype.replicas_acks_success_template = Handlebars.templates['namespace_view-edit_datacenter_replica-success-template'];

    DatacenterReplicas.prototype.replication_complete_template = Handlebars.templates['namespace_view-edit_datacenter_replica-replication_done-template'];

    DatacenterReplicas.prototype.replication_status = Handlebars.templates['namespace_view-edit_datacenter_replica-replication_status-template'];

    DatacenterReplicas.prototype.replicas_ajax_error_template = Handlebars.templates['namespace_view-edit_datacenter_replica-ajax_error-template'];

    DatacenterReplicas.prototype.need_replicas_template = Handlebars.templates['need_replicas-template'];

    DatacenterReplicas.prototype.progress_bar_template = Handlebars.templates['backfill_progress_bar'];

    DatacenterReplicas.prototype.success_set_primary = Handlebars.templates['changed_primary_dc-replica-template'];

    DatacenterReplicas.prototype.states = ['read_only', 'editable'];

    DatacenterReplicas.prototype.events = {
      'click .close': 'remove_parent_alert',
      'click .make-primary.btn': 'make_primary',
      'click .update-replicas.btn': 'submit_replicas_acks',
      'click .edit.btn': 'edit',
      'click .cancel.btn': 'cancel_edit',
      'keyup #replicas_value': 'keypress_replicas_acks',
      'keyup #acks_value': 'keypress_replicas_acks'
    };

    DatacenterReplicas.prototype.keypress_replicas_acks = function(event) {
      if (event.which === 13) {
        event.preventDefault();
        return this.submit_replicas_acks();
      }
    };

    DatacenterReplicas.prototype.initialize = function(datacenter_id, model) {
      this.model = model;
      this.current_state = this.states[0];
      this.data = '';
      if (datacenter_id === universe_datacenter.get('id')) {
        this.datacenter = universe_datacenter;
      } else if (datacenters.get(datacenter_id) != null) {
        this.datacenter = datacenters.get(datacenter_id);
      }
      if (this.datacenter != null) {
        this.datacenter.on('all', this.render);
      }
      this.model.on('change:primary_uuid', this.render);
      progress_list.on('all', this.render_progress);
      this.model.on('change:ack_expectations', this.render_acks_replica);
      this.model.on('change:replica_affinities', this.render_acks_replica);
      return this.render_progress();
    };

    DatacenterReplicas.prototype.remove_parent_alert = function(event) {
      var element;
      event.preventDefault();
      element = $(event.target).parent();
      return element.slideUp('fast', function() {
        return element.remove();
      });
    };

    DatacenterReplicas.prototype.edit = function() {
      this.current_state = this.states[1];
      return this.render();
    };

    DatacenterReplicas.prototype.cancel_edit = function() {
      this.current_state = this.states[0];
      return this.render();
    };

    DatacenterReplicas.prototype.render_acks_replica = function() {
      if (this.current_state === this.states[0]) {
        return this.render();
      }
    };

    DatacenterReplicas.prototype.render_progress = function() {
      var progress_data;
      if (!(this.datacenter != null)) {
        return '';
      }
      progress_data = DataUtils.get_backfill_progress_agg(this.model.get('id'), this.datacenter.get('id'));
      if ((progress_data != null) && _.isNaN(progress_data.percentage) === false) {
        this.is_backfilling = true;
        this.$('.progress_bar_full_container').slideDown('fast');
        return this.$('.progress_bar_container').html(this.progress_bar_template(progress_data));
      } else {
        if (this.is_backfilling === true) {
          collect_server_data_once();
        }
        this.is_backfilling = false;
        this.$('.progress_bar_container').empty();
        return this.$('.progress_bar_full_container').slideUp('fast');
      }
    };

    DatacenterReplicas.prototype.render = function() {
      var data, max_machines, replicas_count;
      if (!(this.datacenter != null)) {
        return '';
      }
      replicas_count = DataUtils.get_replica_affinities(this.model.get('id'), this.datacenter.get('id'));
      if (this.model.get('primary_uuid') === this.datacenter.get('id')) {
        replicas_count++;
      }
      if (this.current_state === this.states[1]) {
        max_machines = this.datacenter.compute_num_machines_not_used_by_other_datacenters(this.model);
        if (this.datacenter.get('id') !== universe_datacenter.get('id')) {
          max_machines = Math.min(max_machines, DataUtils.get_datacenter_machines(this.datacenter.get('id')).length);
        }
      }
      data = {
        name: this.datacenter.get('name'),
        total_machines: machines.length,
        acks: DataUtils.get_ack_expectations(this.model.get('id'), this.datacenter.get('id')),
        primary: this.model.get('primary_uuid') === this.datacenter.get('id'),
        replicas: replicas_count,
        editable: this.current_state === this.states[1],
        max_replicas: (max_machines != null ? max_machines : void 0),
        max_acks: (max_machines != null ? max_machines : void 0)
      };
      if (!_.isEqual(data, this.data)) {
        this.data = data;
        if (this.datacenter.get('id') === universe_datacenter.get('id')) {
          this.$el.html(this.universe_template(data));
        } else {
          this.$el.html(this.template(data));
        }
        if (this.current_state === this.states[1]) {
          this.$('#replicas_value').focus();
        }
      }
      return this;
    };

    DatacenterReplicas.prototype.compute_max_machines = function() {
      this.max_machines = this.datacenter.compute_num_machines_not_used_by_other_datacenters(this.model);
      this.need_explanation = this.max_machines < DataUtils.get_datacenter_machines(this.datacenter.get('id')).length;
      if (this.datacenter.get('id') !== universe_datacenter.get('id')) {
        this.max_machines = Math.min(this.max_machines, DataUtils.get_datacenter_machines(this.datacenter.get('id')).length);
      }
      if (this.current_state !== this.states[1]) {
        return this.render();
      }
    };

    DatacenterReplicas.prototype.alert_replicas_acks = function(msg_errors) {
      this.$('.save_replicas_and_acks').prop('disabled', 'disabled');
      this.$('.replicas_acks-alert').html(this.error_template({
        msg_errors: msg_errors
      }));
      return this.$('.replicas_acks-alert').slideDown('fast');
    };

    DatacenterReplicas.prototype.remove_alert_replicas_acks = function() {
      this.$('.save_replicas_and_acks').removeProp('disabled');
      this.$('.replicas_acks-alert').slideUp('fast');
      return this.$('.replicas_acks-alert').html('');
    };

    DatacenterReplicas.prototype.check_replicas_acks = function(event) {
      var msg_error, num_acks, num_replicas;
      this.compute_max_machines();
      if (((event != null ? event.which : void 0) != null) && event.which === 13) {
        this.submit_replicas_acks();
      }
      num_replicas = this.$('#replicas_value').val();
      num_acks = this.$('#acks_value').val();
      msg_error = [];
      if (num_replicas !== '' && DataUtils.is_integer(num_replicas) === false) {
        msg_error.push('The number of replicas must be an integer.');
      }
      if (num_acks !== '' && DataUtils.is_integer(num_acks) === false) {
        msg_error.push('The number of acks must be an integer.');
      }
      if (msg_error.length !== 0) {
        this.alert_replicas_acks(msg_error);
        return false;
      }
      num_replicas = parseInt(num_replicas);
      num_acks = parseInt(num_acks);
      msg_error = [];
      if (num_replicas > this.max_machines) {
        msg_error.push(this.error_msg_template({
          too_many_replicas: true,
          num_replicas: num_replicas,
          max_machines: this.max_machines
        }));
      }
      if (num_replicas === 0 && this.model.get('primary_uuid') === this.datacenter.get('id')) {
        msg_error.push(this.error_msg_template({
          need_at_least_one_replica: true,
          name: this.datacenter.get('name')
        }));
      }
      if (num_acks > num_replicas) {
        msg_error.push(this.error_msg_template({
          too_many_acks: true,
          num_acks: num_acks,
          num_replicas: num_replicas
        }));
      }
      if (msg_error.length !== 0) {
        this.alert_replicas_acks(msg_error);
        return false;
      }
      this.remove_alert_replicas_acks();
      return true;
    };

    DatacenterReplicas.prototype.submit_replicas_acks = function(event) {
      var ack_expectations_to_send, datacenter_id, num_acks, num_replicas, replica_affinities_to_send, replicas_length;
      if (this.check_replicas_acks() === false) {
        return;
      }
      if ((this.sending != null) && this.sending === true) {
        return;
      }
      this.sending = true;
      this.$('.update-replicas').prop('disabled', 'disabled');
      num_replicas = parseInt(this.$('#replicas_value').val());
      num_acks = parseInt(this.$('#acks_value').val());
      if (this.model.get('primary_uuid') === this.datacenter.get('id')) {
        num_replicas -= 1;
      }
      replica_affinities_to_send = {};
      replica_affinities_to_send[this.datacenter.get('id')] = num_replicas;
      ack_expectations_to_send = {};
      ack_expectations_to_send[this.datacenter.get('id')] = {
        expectation: num_acks,
        hard_durability: this.model.get_durability()
      };
      this.data_cached = {
        num_replicas: num_replicas,
        num_acks: num_acks
      };
      replicas_length = 1;
      for (datacenter_id in replica_affinities_to_send) {
        replicas_length += replica_affinities_to_send[datacenter_id];
      }
      window.app.current_view.replicas.render_status({
        new_value: replicas_length * this.model.get('shards').length
      });
      window.app.current_view.shards.render_status({
        new_value: this.model.get('shards').length
      });
      window.app.current_view.server_assignments.render();
      return $.ajax({
        processData: false,
        url: "ajax/semilattice/" + (this.model.get("protocol")) + "_namespaces/" + (this.model.get('id')),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          replica_affinities: replica_affinities_to_send,
          ack_expectations: ack_expectations_to_send
        }),
        success: this.on_success_replicas_and_acks,
        error: this.on_error
      });
    };

    DatacenterReplicas.prototype.on_success_replicas_and_acks = function() {
      var datacenter_id, new_acks, new_replicas, replicas_length;
      this.sending = false;
      this.$('.update-replicas').removeProp('disabled');
      window.collect_progress();
      new_replicas = this.model.get('replica_affinities');
      new_replicas[this.datacenter.get('id')] = this.data_cached.num_replicas;
      this.model.set('replica_affinities', new_replicas);
      new_acks = DataUtils.deep_copy(this.model.get('ack_expectations'));
      new_acks[this.datacenter.get('id')] = {
        expectation: this.data_cached.num_acks,
        hard_durability: this.model.get_durability()
      };
      this.model.set('ack_expectations', new_acks);
      this.current_state = this.states[0];
      this.render();
      replicas_length = 1;
      for (datacenter_id in new_replicas) {
        replicas_length += new_replicas[datacenter_id];
      }
      window.app.current_view.replicas.render_status({
        got_response: true,
        replicas_length: replicas_length,
        shards_length: this.model.get('shards').length
      });
      window.app.current_view.replicas;
      window.app.current_view.shards.render_status({
        got_response: true
      });
      this.replicating = true;
      return this.$('.status-alert').hide();
    };

    DatacenterReplicas.prototype.on_error = function() {
      this.sending = false;
      this.$('.update-replicas').removeProp('disabled');
      this.$('.replicas_acks-alert').html(this.replicas_ajax_error_template());
      return this.$('.replicas_acks-alert').slideDown('fast');
    };

    DatacenterReplicas.prototype.make_primary = function() {
      var data, new_affinities, new_dc, old_dc, primary_pinnings, shard;
      new_dc = this.datacenter;
      if (!(this.model.get('replica_affinities')[new_dc.get('id')] != null) || this.model.get('replica_affinities')[new_dc.get('id')] < 1) {
        this.$('.make_primary-alert-content').html(this.error_msg_template({
          need_replica_for_primary: true
        }));
        this.$('.make_primary-alert').slideDown('fast');
        return '';
      }
      new_affinities = {};
      if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
        old_dc = universe_datacenter;
      } else {
        old_dc = datacenters.get(this.model.get('primary_uuid'));
      }
      if (old_dc != null) {
        new_affinities[old_dc.get('id')] = DataUtils.get_replica_affinities(this.model.get('id'), old_dc.get('id')) + 1;
      }
      new_affinities[new_dc.get('id')] = DataUtils.get_replica_affinities(this.model.get('id'), new_dc.get('id')) - 1;
      primary_pinnings = {};
      for (shard in this.model.get('primary_pinnings')) {
        primary_pinnings[shard] = null;
      }
      data = {
        primary_uuid: new_dc.get('id'),
        replica_affinities: new_affinities,
        primary_pinnings: primary_pinnings
      };
      this.data_cached = data;
      return $.ajax({
        processData: false,
        url: "ajax/semilattice/" + (this.model.get("protocol")) + "_namespaces/" + (this.model.get('id')),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: this.on_success,
        error: this.on_error
      });
    };

    DatacenterReplicas.prototype.on_success = function() {
      this.model.set(this.data_cached);
      this.$('.make_primary-alert-content').html(this.success_set_primary());
      return this.$('.make_primary-alert').slideDown('fast');
    };

    DatacenterReplicas.prototype.destroy = function() {
      if (this.datacenter != null) {
        this.datacenter.off('all', this.render);
      }
      this.model.off('change:primary_uuid', this.render);
      progress_list.off('all', this.render_progress);
      this.model.off('change:ack_expectations', this.render_acks_replica);
      return this.model.off('change:replica_affinities', this.render_acks_replica);
    };

    return DatacenterReplicas;

  })(Backbone.View);
  return this.PrimaryDatacenter = (function(_super) {

    __extends(PrimaryDatacenter, _super);

    function PrimaryDatacenter() {
      this.destroy = __bind(this.destroy, this);

      this.cancel_change_primary = __bind(this.cancel_change_primary, this);

      this.on_error_pin = __bind(this.on_error_pin, this);

      this.on_success_pin = __bind(this.on_success_pin, this);

      this.set_new_primary = __bind(this.set_new_primary, this);

      this.submit_change_primary = __bind(this.submit_change_primary, this);

      this.change_primary = __bind(this.change_primary, this);

      this.turn_primary_on = __bind(this.turn_primary_on, this);

      this.turn_primary_off = __bind(this.turn_primary_off, this);

      this.render_content = __bind(this.render_content, this);

      this.render = __bind(this.render, this);

      this.on_error_off = __bind(this.on_error_off, this);

      this.on_success_off = __bind(this.on_success_off, this);

      this.submit_confirm_off = __bind(this.submit_confirm_off, this);

      this.cancel_confirm_off = __bind(this.cancel_confirm_off, this);

      this.edit_primary = __bind(this.edit_primary, this);

      this.change_pin = __bind(this.change_pin, this);

      this.initialize = __bind(this.initialize, this);
      return PrimaryDatacenter.__super__.constructor.apply(this, arguments);
    }

    PrimaryDatacenter.prototype.template = Handlebars.templates['namespace_view-primary_datacenter-template'];

    PrimaryDatacenter.prototype.content_template = Handlebars.templates['namespace_view-primary_datacenter_content-template'];

    PrimaryDatacenter.prototype.states = ['none', 'show_primary', 'choose_primary', 'confirm_off'];

    PrimaryDatacenter.prototype.initialize = function() {
      this.state = 'none';
      return this.model.on('change:primary_uuid', this.change_pin);
    };

    PrimaryDatacenter.prototype.events = function() {
      return {
        'click label[for=primary-on]': 'turn_primary_on',
        'click label[for=primary-off]': 'turn_primary_off',
        'click .btn.change-primary': 'change_primary',
        'click .btn.submit-change-primary': 'submit_change_primary',
        'click .btn.cancel-change-primary': 'cancel_change_primary',
        'click .btn.cancel-confirm-off': 'cancel_confirm_off',
        'click .btn.submit-confirm-off': 'submit_confirm_off',
        'click .btn.edit': 'edit_primary',
        'click .alert .close': 'close_error'
      };
    };

    PrimaryDatacenter.prototype.close_error = function(event) {
      event.preventDefault();
      return $(event.currentTarget).parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    PrimaryDatacenter.prototype.change_pin = function() {
      if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
        this.state = 'none';
        this.$('#primary-off').trigger('click');
        return this.turn_primary_off();
      } else {
        this.state = 'none';
        this.$('#primary-on').trigger('click');
        return this.turn_primary_on();
      }
    };

    PrimaryDatacenter.prototype.edit_primary = function() {
      this.state = 'choose_primary';
      return this.turn_primary_on(true);
    };

    PrimaryDatacenter.prototype.cancel_confirm_off = function() {
      this.$('#primary-on').trigger('click');
      return this.turn_primary_on();
    };

    PrimaryDatacenter.prototype.submit_confirm_off = function() {
      var current_primary, new_primary;
      new_primary = universe_datacenter.get('id');
      current_primary = this.model.get('primary_uuid');
      return this.set_new_primary(new_primary, current_primary, this.on_success_off, this.on_error_off);
    };

    PrimaryDatacenter.prototype.on_success_off = function() {
      var data_to_set, dc, value, _ref;
      data_to_set = this.data_cached;
      _ref = this.model.get('replica_affinities');
      for (dc in _ref) {
        value = _ref[dc];
        if (!(data_to_set['replica_affinities'][dc] != null)) {
          data_to_set['replica_affinities'][dc] = value;
        }
      }
      this.model.set(data_to_set);
      this.model.trigger('change:primary_uuid');
      return this.turn_primary_off();
    };

    PrimaryDatacenter.prototype.on_error_off = function() {
      return this.$('.alert-error').slideDown('fast');
    };

    PrimaryDatacenter.prototype.render = function() {
      var data;
      data = {
        force_on: false
      };
      if (this.model.get('primary_uuid') !== universe_datacenter.get('id')) {
        this.state = 'show_primary';
        data.force_on = true;
      }
      this.$el.html(this.template(data));
      this.render_content();
      return this;
    };

    PrimaryDatacenter.prototype.render_content = function(data) {
      var datacenter_name, primary_name, that;
      if (!(data != null)) {
        data = {};
      }
      if (this.model.get('primary_uuid') === universe_datacenter) {
        primary_name = 'No primary';
      } else if (datacenters.get(this.model.get('primary_uuid')) != null) {
        primary_name = datacenters.get(this.model.get('primary_uuid')).get('name');
      } else {
        primary_name = 'Not found datacenter';
      }
      data = _.extend(data, {
        primary_isnt_universe: this.model.get('primary_uuid') !== universe_datacenter.get('id'),
        primary_id: this.model.get('primary_uuid'),
        primary_name: primary_name
      });
      if (this.state === 'confirm_off') {
        data.confirm_off = true;
        data.primary_id = this.model.get('primary_uuid');
        if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
          datacenter_name = 'Cluster';
        } else if (datacenters.get(this.model.get('primary_uuid')) != null) {
          datacenter_name = datacenters.get(this.model.get('primary_uuid')).get('name');
        } else {
          datacenter_name = 'A deleted datacenter';
        }
        data.primary_name = datacenter_name;
      }
      if (this.state === 'show_primary') {
        data.show_primary = true;
        data.primary_id = this.model.get('primary_uuid');
        if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
          datacenter_name = 'Cluster';
        } else if (datacenters.get(this.model.get('primary_uuid')) != null) {
          datacenter_name = datacenters.get(this.model.get('primary_uuid')).get('name');
        } else {
          datacenter_name = 'A deleted datacenter';
        }
        data.primary_name = datacenter_name;
      }
      if (this.state === 'choose_primary') {
        data.choose_primary = true;
        that = this;
        data.datacenters = _.map(datacenters.models, function(datacenter) {
          return {
            id: datacenter.get('id'),
            name: datacenter.get('name'),
            is_primary: datacenter.get('id') === that.model.get('primary_uuid')
          };
        });
        if (this.model.get('primary_uuid') !== universe_datacenter.get('id')) {
          data.primary_dc_uuid = this.model.get('primary_uuid');
          data.primary_dc_name = datacenters.get(this.model.get('primary_uuid')).get('name');
        }
      }
      return this.$('.content').html(this.content_template(data));
    };

    PrimaryDatacenter.prototype.turn_primary_off = function() {
      if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
        this.state = 'none';
      } else {
        this.state = 'confirm_off';
      }
      return this.render_content();
    };

    PrimaryDatacenter.prototype.turn_primary_on = function(force_choose) {
      if (this.model.get('primary_uuid') === universe_datacenter.get('id') || force_choose === true) {
        this.state = 'choose_primary';
      } else {
        this.state = 'show_primary';
      }
      return this.render_content();
    };

    PrimaryDatacenter.prototype.change_primary = function() {
      this.state = 'choose_primary';
      return this.render_content();
    };

    PrimaryDatacenter.prototype.submit_change_primary = function() {
      var current_primary, new_primary;
      new_primary = this.$('.datacenter_uuid_list').val();
      current_primary = this.model.get('primary_uuid');
      return this.set_new_primary(new_primary, current_primary, this.on_success_pin, this.on_error_pin);
    };

    PrimaryDatacenter.prototype.set_new_primary = function(new_primary, current_primary, on_success, on_error) {
      var data, new_ack, new_replica_affinities, primary_pinnings, shard, _i, _len, _ref;
      primary_pinnings = {};
      _ref = this.model.get('primary_pinnings');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        shard = _ref[_i];
        primary_pinnings[shard] = null;
      }
      new_replica_affinities = {};
      if (this.model.get('replica_affinities')[current_primary] != null) {
        new_replica_affinities[current_primary] = this.model.get('replica_affinities')[current_primary] + 1;
      } else {
        new_replica_affinities[current_primary] = 1;
      }
      if (this.model.get('replica_affinities')[new_primary] != null) {
        if (this.model.get('replica_affinities')[new_primary] > 0) {
          new_replica_affinities[new_primary] = this.model.get('replica_affinities')[new_primary] - 1;
        } else {
          new_replica_affinities[new_primary] = 0;
        }
      } else {
        new_replica_affinities[new_primary] = 0;
      }
      new_ack = this.model.get('ack_expectations');
      if ((!(this.model.get('ack_expectations')[new_primary] != null)) || this.model.get('ack_expectations')[new_primary].expectation === 0) {
        new_ack[new_primary] = {
          expectation: 1,
          hard_durability: this.model.get_durability()
        };
      }
      data = {
        primary_uuid: new_primary,
        primary_pinnings: primary_pinnings,
        replica_affinities: new_replica_affinities,
        ack_expectations: new_ack
      };
      this.data_cached = data;
      return $.ajax({
        url: "ajax/semilattice/" + (this.model.get("protocol")) + "_namespaces/" + (this.model.get('id')),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: on_success,
        error: on_error
      });
    };

    PrimaryDatacenter.prototype.on_success_pin = function() {
      var data_to_set, dc, value, _ref;
      data_to_set = this.data_cached;
      _ref = this.model.get('replica_affinities');
      for (dc in _ref) {
        value = _ref[dc];
        if (!(data_to_set['replica_affinities'][dc] != null)) {
          data_to_set['replica_affinities'][dc] = value;
        }
      }
      this.model.set(data_to_set);
      this.model.trigger('change:primary_uuid');
      return this.turn_primary_on();
    };

    PrimaryDatacenter.prototype.on_error_pin = function() {
      return this.$('.alert-error').slideDown('fast');
    };

    PrimaryDatacenter.prototype.cancel_change_primary = function() {
      if (this.model.get('primary_uuid') === universe_datacenter.get('id')) {
        this.state = 'none';
      } else {
        this.state = 'show_primary';
      }
      return this.render();
    };

    PrimaryDatacenter.prototype.destroy = function() {
      return this.model.off('change:primary_uuid', this.change_pin);
    };

    return PrimaryDatacenter;

  })(Backbone.View);
});

module('NamespaceView', function() {
  var MAX_SHARD_COUNT;
  MAX_SHARD_COUNT = 32;
  this.Sharding = (function(_super) {

    __extends(Sharding, _super);

    function Sharding() {
      this.destroy = __bind(this.destroy, this);

      this.render_data_repartition = __bind(this.render_data_repartition, this);

      this.switch_to_edit = __bind(this.switch_to_edit, this);

      this.switch_to_read = __bind(this.switch_to_read, this);

      this.render = __bind(this.render, this);

      this.check_can_change_shards = __bind(this.check_can_change_shards, this);

      this.render_status = __bind(this.render_status, this);

      this.render_status_server_update = __bind(this.render_status_server_update, this);

      this.global_trigger_for_shards = __bind(this.global_trigger_for_shards, this);

      this.on_error = __bind(this.on_error, this);

      this.on_success = __bind(this.on_success, this);

      this.shard_table = __bind(this.shard_table, this);

      this.display_msg = __bind(this.display_msg, this);

      this.check_shards_changes = __bind(this.check_shards_changes, this);

      this.keypress_shards_changes = __bind(this.keypress_shards_changes, this);

      this.initialize = __bind(this.initialize, this);
      return Sharding.__super__.constructor.apply(this, arguments);
    }

    Sharding.prototype.template = Handlebars.templates['shards_container-template'];

    Sharding.prototype.view_template = Handlebars.templates['view_shards-template'];

    Sharding.prototype.edit_template = Handlebars.templates['edit_shards-template'];

    Sharding.prototype.data_repartition_template = Handlebars.templates['data_repartition-template'];

    Sharding.prototype.feedback_template = Handlebars.templates['edit_shards-feedback-template'];

    Sharding.prototype.error_ajax_template = Handlebars.templates['edit_shards-ajax_error-template'];

    Sharding.prototype.alert_shard_template = Handlebars.templates['alert_shard-template'];

    Sharding.prototype.reasons_cannot_shard_template = Handlebars.templates['shards-reason_cannot_shard-template'];

    Sharding.prototype.shard_status_template = Handlebars.templates['shard_status-template'];

    Sharding.prototype.className = 'shards_container';

    Sharding.prototype.state = {
      0: 'read',
      1: 'edit'
    };

    Sharding.prototype.events = {
      'keypress .num-shards': 'keypress_shards_changes',
      'click .edit': 'switch_to_edit',
      'click .cancel': 'switch_to_read',
      'click .rebalance': 'shard_table'
    };

    Sharding.prototype.initialize = function() {
      this.can_change_shards = false;
      this.reasons_cannot_shard = {};
      this.expected_num_shards = this.model.get('shards').length;
      issues.on('all', this.check_can_change_shards);
      this.model.on('change:key_distr', this.render_data_repartition);
      this.model.on('change:shards', this.global_trigger_for_shards);
      this.model.on('change:ack_expectations', this.render_status_server_update);
      directory.on('all', this.render_status);
      return this.progress_bar = new UIComponents.OperationProgressBar(this.shard_status_template);
    };

    Sharding.prototype.keypress_shards_changes = function(event) {
      if (event.which === 13) {
        event.preventDefault();
        return this.shard_table();
      }
    };

    Sharding.prototype.check_shards_changes = function() {
      var current_count, data, distr_keys, error_msg, i, key, new_num_shards, no_more_splits, rows_per_shard, shard_set, splitIndex, split_points, total_rows, _i, _j, _len, _ref,
        _this = this;
      new_num_shards = this.$('.num-shards').val();
      if (DataUtils.is_integer(new_num_shards) === false) {
        error_msg = "The number of shards must be an integer.";
        this.display_msg(error_msg);
        return;
      }
      if (new_num_shards < 1 || new_num_shards > MAX_SHARD_COUNT) {
        error_msg = "The number of shards must be beteen 1 and " + MAX_SHARD_COUNT + ".";
        this.display_msg(error_msg);
        return;
      }
      data = this.model.get('key_distr');
      distr_keys = this.model.get('key_distr_sorted');
      total_rows = _.reduce(distr_keys, (function(agg, key) {
        return agg + data[key];
      }), 0);
      rows_per_shard = total_rows / new_num_shards;
      if (!(data != null) || !(distr_keys != null)) {
        error_msg = "The distribution of keys has not been loaded yet. Please try again.";
        this.display_msg(error_msg);
        return;
      }
      if (distr_keys.length < new_num_shards) {
        error_msg = 'There is not enough data in the database to make this number of balanced shards.';
        this.display_msg(error_msg);
        return;
      }
      current_count = 0;
      split_points = [];
      no_more_splits = false;
      for (i = _i = 0, _len = distr_keys.length; _i < _len; i = ++_i) {
        key = distr_keys[i];
        if (i === 0) {
          if (key !== '') {
            return 'Error';
          }
          split_points.push(key);
          current_count += data[key];
          continue;
        }
        if (distr_keys.length - i <= new_num_shards - split_points.length) {
          split_points.push(key);
          continue;
        }
        if (current_count >= rows_per_shard * split_points.length) {
          split_points.push(key);
        }
        current_count += data[key];
      }
      split_points.push(null);
      shard_set = [];
      for (splitIndex = _j = 0, _ref = split_points.length - 2; 0 <= _ref ? _j <= _ref : _j >= _ref; splitIndex = 0 <= _ref ? ++_j : --_j) {
        shard_set.push(JSON.stringify([split_points[splitIndex], split_points[splitIndex + 1]]));
      }
      this.$('.cannot_shard-alert').slideUp('fast');
      this.shard_set = shard_set;
      return true;
    };

    Sharding.prototype.display_msg = function(msg) {
      this.$('.cannot_shard-alert').html(this.feedback_template(msg));
      return this.$('.cannot_shard-alert').slideDown('fast');
    };

    Sharding.prototype.shard_table = function(event) {
      var data, datacenter_id, new_replicas, replicas_length, shard, _i, _len, _ref;
      if (event != null) {
        event.preventDefault();
      }
      if (this.check_shards_changes() === true) {
        if ((this.sending != null) && this.sending === true) {
          return '';
        }
        this.sending = true;
        this.$('.rebalance').prop('disabled', 'disabled');
        this.empty_master_pin = {};
        this.empty_replica_pins = {};
        _ref = this.shard_set;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          shard = _ref[_i];
          this.empty_master_pin[shard] = null;
          this.empty_replica_pins[shard] = [];
        }
        data = {
          shards: this.shard_set,
          primary_pinnings: this.empty_master_pin,
          secondary_pinnings: this.empty_replica_pins
        };
        this.data_sent = data;
        this.expected_num_shards = this.shard_set.length;
        this.render_status({
          new_value: this.shard_set.length
        });
        new_replicas = this.model.get('replica_affinities');
        replicas_length = 1;
        for (datacenter_id in new_replicas) {
          replicas_length += new_replicas[datacenter_id];
        }
        window.app.current_view.replicas.render_status({
          new_value: replicas_length * this.model.get('shards').length
        });
        return $.ajax({
          processData: false,
          url: "ajax/semilattice/" + this.model.attributes.protocol + "_namespaces/" + (this.model.get('id')) + "?prefer_distribution=1",
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(data),
          success: this.on_success,
          error: this.on_error
        });
      }
    };

    Sharding.prototype.on_success = function() {
      var datacenter_id, new_replicas, replicas_length;
      this.sending = false;
      this.$('.rebalance').removeProp('disabled');
      this.model.set('shards', this.shard_set);
      this.model.set('primary_pinnings', this.empty_master_pin);
      this.model.set('secondary_pinnings', this.empty_replica_pins);
      this.switch_to_read();
      this.render_status({
        got_response: true
      });
      new_replicas = this.model.get('replica_affinities');
      replicas_length = 1;
      for (datacenter_id in new_replicas) {
        replicas_length += new_replicas[datacenter_id];
      }
      return window.app.current_view.replicas.render_status({
        got_response: true,
        replicas_length: replicas_length,
        shards_length: this.model.get('shards').length
      });
    };

    Sharding.prototype.on_error = function() {
      this.sending = false;
      this.$('.rebalance').removeProp('disabled');
      this.display_msg(this.error_ajax_template());
      this.progress_bar.set_none_state();
      this.expected_num_shards = this.model.get('shards').length;
      return this.render_status();
    };

    Sharding.prototype.global_trigger_for_shards = function() {
      if (this.current_state === this.state[0]) {
        this.switch_to_read();
      }
      this.render_data_repartition();
      return this.render_status_server_update();
    };

    Sharding.prototype.render_status_server_update = function() {
      this.expected_num_shards = this.model.get('shards').length;
      this.progress_bar.skip_to_processing();
      return this.render_status();
    };

    Sharding.prototype.render_status = function(progress_bar_info) {
      var activities, activity, activity_id, blueprint, datacenter_id, expected_status, machine, machine_id, master, num_shards, num_shards_in_blueprint, num_shards_not_ready, num_shards_ready, role, shard, shards, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
      if (!(progress_bar_info != null) || typeof progress_bar_info !== 'object') {
        progress_bar_info = {};
      }
      blueprint = this.model.get('blueprint').peers_roles;
      if (!(blueprint != null)) {
        return '';
      }
      shards = {};
      num_shards = this.model.get('shards').length;
      _ref = this.model.get('shards');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        shard = _ref[_i];
        shards[shard] = {
          master: null,
          machines_not_ready: {},
          acks_expected: _.extend({}, this.model.get('ack_expectations').expectation)
        };
        if ((!(shards[shard]['acks_expected'][this.model.get('primary_uuid')] != null)) || shards[shard]['acks_expected'][this.model.get('primary_uuid')] === 0) {
          shards[shard]['acks_expected'][this.model.get('primary_uuid')] = 1;
        }
      }
      for (machine_id in blueprint) {
        num_shards_in_blueprint = 0;
        for (shard in blueprint[machine_id]) {
          num_shards_in_blueprint++;
        }
        if (num_shards_in_blueprint !== this.expected_num_shards) {
          this.$('.shard-status').html(this.progress_bar.render(0, this.expected_num_shards, progress_bar_info).$el);
          return '';
        }
      }
      for (machine_id in blueprint) {
        for (shard in blueprint[machine_id]) {
          if (!(shards[shard] != null)) {
            this.$('.shard-status').html(this.progress_bar.render(0, this.expected_num_shards, progress_bar_info).$el);
            return '';
          }
          role = blueprint[machine_id][shard];
          if (role === 'role_nothing') {
            shards[shard]['machines_not_ready'][machine_id] = true;
            continue;
          }
          if (role === 'role_primary') {
            expected_status = 'primary';
          } else if (role === 'role_secondary') {
            expected_status = 'secondary_up_to_date';
          }
          activities = (_ref1 = directory.get(machine_id)) != null ? (_ref2 = _ref1.get(this.model.get('protocol') + '_namespaces')) != null ? (_ref3 = _ref2['reactor_bcards'][this.model.get('id')]) != null ? _ref3['activity_map'] : void 0 : void 0 : void 0;
          if (activities != null) {
            for (activity_id in activities) {
              activity = activities[activity_id];
              if (activity[0] === shard) {
                if (activity[1]['type'] !== expected_status) {
                  shards[shard]['machines_not_ready'][machine_id] = true;
                } else {
                  if (activity[1]['type'] === 'primary') {
                    shards[shard].master = machine_id;
                  }
                }
              }
            }
          }
        }
      }
      for (shard in shards) {
        _ref4 = machines.models;
        for (_j = 0, _len1 = _ref4.length; _j < _len1; _j++) {
          machine = _ref4[_j];
          machine_id = machine.get('id');
          if (!(shards[shard]['machines_not_ready'][machine_id] != null)) {
            datacenter_id = machine.get('datacenter_uuid');
            if ((!(shards[shard]['acks_expected'][datacenter_id] != null)) || shards[shard]['acks_expected'][datacenter_id] <= 0) {
              shards[shard]['acks_expected'][universe_datacenter.get('id')]--;
            } else {
              shards[shard]['acks_expected'][datacenter_id]--;
            }
          }
        }
      }
      num_shards_not_ready = 0;
      for (shard in shards) {
        master = shards[shard]['master'];
        if (master === null || (shards[shard]['machines_not_ready'][master] != null)) {
          num_shards_not_ready++;
          continue;
        }
        for (datacenter_id in shards[shard]['acks_expected']) {
          if (shards[shard]['acks_expected'][datacenter_id] > 0) {
            num_shards_not_ready++;
            break;
          }
        }
      }
      num_shards_ready = num_shards - num_shards_not_ready;
      this.$('.shard-status').html(this.progress_bar.render(num_shards_ready, num_shards, progress_bar_info).$el);
      return this;
    };

    Sharding.prototype.check_can_change_shards = function() {
      var can_change_shards_now, issue, reasons_cannot_shard, _i, _len, _ref;
      reasons_cannot_shard = {};
      can_change_shards_now = true;
      _ref = issues.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        issue = _ref[_i];
        if (issue.get('type') === 'UNSATISFIABLE_GOALS' && issue.get('namespace_id') === this.model.get('id')) {
          can_change_shards_now = false;
          reasons_cannot_shard.unsatisfiable_goals = true;
        }
        if (issue.get('type') === 'MACHINE_DOWN') {
          can_change_shards_now = false;
          reasons_cannot_shard.machine_down = true;
        }
      }
      if (this.can_change_shards === true && can_change_shards_now === false) {
        this.$('.critical_error').html(this.reasons_cannot_shard_template(this.reasons_cannot_shard));
        this.$('.critical_error').slideDown();
        this.$('.edit').prop('disabled', 'disabled');
        return this.$('.rebalance').prop('disabled', 'disabled');
      } else if (this.can_change_shards === false && can_change_shards_now === true) {
        this.$('.critical_error').hide();
        this.$('.critical_error').empty();
        this.$('.edit').removeProp('disabled');
        return this.$('.rebalance').removeProp('disabled');
      } else if (this.can_change_shards === false && can_change_shards_now === false) {
        if (!_.isEqual(reasons_cannot_shard, this.reasons_cannot_shard)) {
          this.reasons_cannot_shard = reasons_cannot_shard;
          this.$('.critical_error').html(this.reasons_cannot_shard_template(this.reasons_cannot_shard));
          this.$('.critical_error').slideDown();
        }
        this.$('.edit').prop('disabled', 'disabled');
        return this.$('.rebalance').prop('disabled', 'disabled');
      }
    };

    Sharding.prototype.render = function() {
      this.$el.html(this.template({}));
      this.switch_to_read();
      this.render_status();
      this.check_can_change_shards();
      return this;
    };

    Sharding.prototype.switch_to_read = function() {
      this.current_state = this.state[0];
      return this.$('.edit-shards').html(this.view_template({
        num_shards: this.model.get('shards').length
      }));
    };

    Sharding.prototype.switch_to_edit = function() {
      var max_shards;
      if (!(this.model.get('key_distr_sorted') != null)) {
        max_shards = 1;
      } else {
        max_shards = Math.min(32, this.model.get('key_distr_sorted').length);
        max_shards = Math.max(1, max_shards);
      }
      this.current_state = this.state[1];
      this.$('.edit-shards').html(this.edit_template({
        num_shards: this.model.get('shards').length,
        max_shards: max_shards
      }));
      return this.$('.num-shards').focus();
    };

    Sharding.prototype.render_data_repartition = function() {
      var axe_legend, bar_width, extra_data, margin_bar, margin_height, margin_width, margin_width_inner, max_keys, min_keys, min_margin_width_inner, new_shard, shard, shards, svg, svg_height, svg_width, total_keys, width_of_all_bars, y, _i, _len, _ref;
      $('.tooltip').remove();
      shards = [];
      total_keys = 0;
      _ref = this.model.get('shards');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        shard = _ref[_i];
        new_shard = {
          boundaries: shard,
          num_keys: parseInt(this.model.compute_shard_rows_approximation(shard))
        };
        shards.push(new_shard);
        total_keys += new_shard.num_keys;
      }
      max_keys = d3.max(shards, function(d) {
        return d.num_keys;
      });
      min_keys = d3.min(shards, function(d) {
        return d.num_keys;
      });
      if ((this.model.get('key_distr') != null) && (max_keys != null) && !_.isNaN(max_keys && shards.length !== 0)) {
        this.$('.data_repartition-container').html(this.data_repartition_template());
        this.$('.loading_text-diagram').css('display', 'none');
        svg_width = 328;
        svg_height = 270;
        margin_width = 20;
        margin_height = 20;
        min_margin_width_inner = 20;
        if (shards.length === 1) {
          bar_width = 100;
          margin_bar = 20;
        } else if (shards.length === 2) {
          bar_width = 80;
          margin_bar = 20;
        } else {
          bar_width = Math.floor(0.8 * (328 - margin_width * 2 - min_margin_width_inner * 2) / shards.length);
          margin_bar = Math.floor(0.2 * (328 - margin_width * 2 - min_margin_width_inner * 2) / shards.length);
        }
        width_of_all_bars = bar_width * shards.length + margin_bar * (shards.length - 1);
        margin_width_inner = Math.floor((svg_width - margin_width * 2 - width_of_all_bars) / 2);
        y = d3.scale.linear().domain([0, max_keys]).range([1, svg_height - margin_height * 2.5]);
        svg = d3.select('.shard-diagram').attr('width', svg_width).attr('height', svg_height).append('svg:g');
        svg.selectAll('rect').data(shards).enter().append('rect').attr('class', 'rect').attr('x', function(d, i) {
          return margin_width + margin_width_inner + bar_width * i + margin_bar * i;
        }).attr('y', function(d) {
          return svg_height - y(d.num_keys) - margin_height - 1;
        }).attr('width', bar_width).attr('height', function(d) {
          return y(d.num_keys);
        }).attr('title', function(d) {
          var i, key, keys, result, _j, _len1;
          keys = $.parseJSON(d.boundaries);
          for (i = _j = 0, _len1 = keys.length; _j < _len1; i = ++_j) {
            key = keys[i];
            keys[i] = pretty_key(key);
            if (typeof keys[i] === 'number') {
              keys[i] = keys[i].toString();
            }
            if (typeof keys[i] === 'string') {
              if (keys[i].length > 7) {
                keys[i] = keys[i].slice(0, 7) + '...';
              }
            }
          }
          result = 'Shard: ';
          result += '[ ' + keys[0] + ', ' + keys[1] + ']';
          result += '<br />~' + d.num_keys + ' keys';
          return result;
        });
        extra_data = [];
        extra_data.push({
          x1: margin_width,
          x2: margin_width,
          y1: margin_height,
          y2: svg_height - margin_height
        });
        extra_data.push({
          x1: margin_width,
          x2: svg_width - margin_width,
          y1: svg_height - margin_height,
          y2: svg_height - margin_height
        });
        svg = d3.select('.shard-diagram').attr('width', svg_width).attr('height', svg_height).append('svg:g');
        svg.selectAll('line').data(extra_data).enter().append('line').attr('x1', function(d) {
          return d.x1;
        }).attr('x2', function(d) {
          return d.x2;
        }).attr('y1', function(d) {
          return d.y1;
        }).attr('y2', function(d) {
          return d.y2;
        });
        axe_legend = [];
        axe_legend.push({
          x: margin_width,
          y: Math.floor(margin_height / 2),
          string: 'Docs',
          anchor: 'middle'
        });
        axe_legend.push({
          x: Math.floor(svg_width / 2),
          y: svg_height,
          string: 'Shards',
          anchor: 'middle'
        });
        svg.selectAll('.legend').data(axe_legend).enter().append('text').attr('x', function(d) {
          return d.x;
        }).attr('y', function(d) {
          return d.y;
        }).attr('text-anchor', function(d) {
          return d.anchor;
        }).text(function(d) {
          return d.string;
        });
        svg.selectAll('.cache').data(y.ticks(5)).enter().append('rect').attr('width', function(d, i) {
          if (i === 0) {
            return 0;
          }
          return 4;
        }).attr('height', 18).attr('x', margin_width - 2).attr('y', function(d) {
          return svg_height - margin_height - y(d) - 14;
        }).attr('fill', '#fff');
        svg.selectAll('.rule').data(y.ticks(5)).enter().append('text').attr('x', margin_width).attr('y', function(d) {
          return svg_height - margin_height - y(d);
        }).attr('text-anchor', "middle").text(function(d, i) {
          if (i !== 0) {
            return d;
          } else {
            return '';
          }
        });
        this.$('rect').tooltip({
          trigger: 'hover'
        });
        this.delegateEvents();
      }
      return this;
    };

    Sharding.prototype.destroy = function() {
      issues.off('all', this.check_can_change_shards);
      this.model.off('change:key_distr', this.render_data_repartition);
      this.model.off('change:shards', this.global_trigger_for_shards);
      this.model.off('change:ack_expectations', this.render_status_server_update);
      return directory.off('all', this.render_status);
    };

    return Sharding;

  })(Backbone.View);
  return this.ChangeShardsModal = (function(_super) {

    __extends(ChangeShardsModal, _super);

    function ChangeShardsModal() {
      this.on_success = __bind(this.on_success, this);

      this.on_submit = __bind(this.on_submit, this);

      this.display_error = __bind(this.display_error, this);

      this.render = __bind(this.render, this);

      this.set_num_shards = __bind(this.set_num_shards, this);

      this.initialize = __bind(this.initialize, this);
      return ChangeShardsModal.__super__.constructor.apply(this, arguments);
    }

    /*
            template: Handlebars.templates['change_shards-modal-template']
            change_shards_success_alert_template: Handlebars.templates['change_shards-success-alert-template']
    */


    ChangeShardsModal.prototype["class"] = 'change_shards';

    ChangeShardsModal.prototype.initialize = function(data) {
      this.model = data.model;
      this.parent = data.parent;
      return ChangeShardsModal.__super__.initialize.apply(this, arguments);
    };

    ChangeShardsModal.prototype.set_num_shards = function(num_shards) {
      return this.num_shards = num_shards;
    };

    ChangeShardsModal.prototype.render = function() {
      ChangeShardsModal.__super__.render.call(this, {
        modal_title: "Confirm rebalancing shards",
        btn_primary_text: "Shard",
        num_shards: this.num_shards
      });
      return $('.btn-primary').focus();
    };

    ChangeShardsModal.prototype.display_error = function(error) {
      this.$('.alert-error').css('display', 'none');
      this.$('.alert-error').html(error);
      this.$('.alert-error').slideDown('fast');
      return this.reset_buttons();
    };

    ChangeShardsModal.prototype.on_submit = function() {
      return ChangeShardsModal.__super__.on_submit.apply(this, arguments);
    };

    ChangeShardsModal.prototype.on_success = function() {
      this.parent.$('.user-alert-space').css('display', 'none');
      this.parent.$('.user-alert-space').html(this.change_shards_success_alert_template({}));
      this.parent.$('.user-alert-space').slideDown('fast');
      ChangeShardsModal.__super__.on_success.apply(this, arguments);
      return namespaces.get(this.model.get('id')).set(this.data_sent);
    };

    return ChangeShardsModal;

  })(UIComponents.AbstractModal);
});

module('NamespaceView', function() {
  return this.ServerAssignments = (function(_super) {

    __extends(ServerAssignments, _super);

    function ServerAssignments() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.get_shards = __bind(this.get_shards, this);

      this.hide_details = __bind(this.hide_details, this);

      this.clean_dom_listeners = __bind(this.clean_dom_listeners, this);

      this.set_listeners = __bind(this.set_listeners, this);

      this.show_secondary = __bind(this.show_secondary, this);

      this.position_popup = __bind(this.position_popup, this);

      this.show_primary = __bind(this.show_primary, this);

      this.initialize = __bind(this.initialize, this);
      return ServerAssignments.__super__.constructor.apply(this, arguments);
    }

    ServerAssignments.prototype.template = Handlebars.templates['namespace_view-server_assignments-template'];

    ServerAssignments.prototype.popup_template = Handlebars.templates['popup_content-template'];

    ServerAssignments.prototype.events = function() {
      return {
        'click .show_primary_link': 'show_primary',
        'click .show_secondary_link': 'show_secondary',
        'click .close': 'hide_details'
      };
    };

    ServerAssignments.prototype.initialize = function() {
      this.model.on('change:blueprint', this.render);
      this.model.on('change:key_distr', this.render);
      return this.data = {};
    };

    ServerAssignments.prototype.show_primary = function(event) {
      var shards;
      event.preventDefault();
      this.clean_dom_listeners();
      shards = this.get_shards(this.$(event.target).data('id'), 'role_primary');
      this.$('.popup_container').html(this.popup_template({
        type_is_master: true,
        shards: shards
      }));
      this.position_popup(event);
      return this.set_listeners(event);
    };

    ServerAssignments.prototype.position_popup = function(event) {
      var margin_left, margin_top;
      this.$('.popup_container').show();
      margin_top = event.pageY - 60 - 13;
      margin_left = event.pageX + 12;
      return this.$('.popup_container').css('margin', margin_top + 'px 0px 0px ' + margin_left + 'px');
    };

    ServerAssignments.prototype.show_secondary = function(event) {
      var shards;
      event.preventDefault();
      this.clean_dom_listeners();
      shards = this.get_shards(this.$(event.target).data('id'), 'role_secondary');
      this.$('.popup_container').html(this.popup_template({
        type_is_secondary: true,
        shards: shards
      }));
      this.position_popup(event);
      return this.set_listeners(event);
    };

    ServerAssignments.prototype.set_listeners = function(event) {
      this.link_clicked = this.$(event.target);
      this.link_clicked.on('mouseup', this.stop_propagation);
      this.$('.popup_container').on('mouseup', this.stop_propagation);
      return $(window).on('mouseup', this.hide_details);
    };

    ServerAssignments.prototype.clean_dom_listeners = function() {
      if (this.link_clicked != null) {
        this.link_clicked.off('mouseup', this.stop_propagation);
      }
      this.$('.popup_container').off('mouseup', this.stop_propagation);
      return $(window).off('mouseup', this.hide_details);
    };

    ServerAssignments.prototype.stop_propagation = function(event) {
      return event.stopPropagation();
    };

    ServerAssignments.prototype.hide_details = function(event) {
      this.$('.popup_container').hide();
      return this.clean_dom_listeners();
    };

    ServerAssignments.prototype.get_shards = function(id, role_requested) {
      var keys, machine_id, peer_roles, role, shard, shards, _ref;
      shards = [];
      _ref = this.model.get('blueprint').peers_roles;
      for (machine_id in _ref) {
        peer_roles = _ref[machine_id];
        if (machine_id === id) {
          for (shard in peer_roles) {
            role = peer_roles[shard];
            if (role === role_requested) {
              keys = this.model.compute_shard_rows_approximation(shard);
              shards.push({
                name: human_readable_shard(shard),
                keys: keys,
                keys_ready: keys != null
              });
            }
          }
        }
      }
      return shards;
    };

    ServerAssignments.prototype.render = function() {
      var data, data_grouped_by_datacenter, data_on_machines, datacenters_for_table, keys, machine, machine_id, peer_roles, role, shard, _ref;
      data_on_machines = {};
      _ref = this.model.get('blueprint').peers_roles;
      for (machine_id in _ref) {
        peer_roles = _ref[machine_id];
        data_on_machines[machine_id] = {
          name: machines.get(machine_id).get('name'),
          id: machine_id,
          num_keys: void 0,
          num_primaries: 0,
          num_secondaries: 0,
          shards: []
        };
        for (shard in peer_roles) {
          role = peer_roles[shard];
          machine = data_on_machines[machine_id];
          keys = this.model.compute_shard_rows_approximation(shard);
          if (machine.num_keys === void 0 && typeof keys === 'string') {
            machine.num_keys = 0;
          }
          if (typeof keys === 'string') {
            machine.num_keys += parseInt(keys);
          }
          if (role === 'role_primary') {
            machine.num_primaries += 1;
          }
          if (role === 'role_secondary') {
            machine.num_secondaries += 1;
          }
          machine.shards.push({
            name: human_readable_shard(shard),
            keys: (typeof keys === 'string' ? parseInt(keys) : void 0),
            role: role
          });
        }
        if (machine.num_primaries === 0 && machine.num_secondaries === 0) {
          delete data_on_machines[machine_id];
        }
      }
      for (machine_id in data_on_machines) {
        machine = data_on_machines[machine_id];
        if (machine.num_keys != null) {
          machine.keys_ready = true;
        }
        if (machine.num_primaries > 0) {
          machine.has_primaries = true;
        }
        if (machine.num_secondaries > 0) {
          machine.has_secondaries = true;
        }
      }
      data_grouped_by_datacenter = _.groupBy(data_on_machines, function(machine) {
        return machines.get(machine.id).get('datacenter_uuid');
      });
      datacenters_for_table = _.map(_.keys(data_grouped_by_datacenter), function(dc_id) {
        var datacenter;
        datacenter = {
          id: dc_id,
          machines: data_grouped_by_datacenter[dc_id]
        };
        if (dc_id === universe_datacenter.get('id')) {
          datacenter.is_universe = true;
        } else {
          datacenter.name = datacenters.get(dc_id).get('name');
        }
        return datacenter;
      });
      datacenters_for_table.sort(function(a, b) {
        if (a.is_universe || b.is_universe) {
          return 1;
        }
        if (b.name > a.name) {
          return 1;
        }
        if (b.name < a.name) {
          return -1;
        }
        return 0;
      });
      data = {
        has_datacenters: datacenters_for_table.length > 0,
        datacenters: datacenters_for_table
      };
      if (!_.isEqual(this.data, data)) {
        this.data = data;
        this.$el.html(this.template(data));
      }
      this.delegateEvents();
      return this;
    };

    ServerAssignments.prototype.destroy = function() {
      this.model.off('change:blueprint', this.render);
      return this.model.off('change:key_distr', this.render);
    };

    return ServerAssignments;

  })(Backbone.View);
});

module('NamespaceView', function() {
  this.NotFound = (function(_super) {

    __extends(NotFound, _super);

    function NotFound() {
      this.render = __bind(this.render, this);
      return NotFound.__super__.constructor.apply(this, arguments);
    }

    NotFound.prototype.template = Handlebars.templates['element_view-not_found-template'];

    NotFound.prototype.initialize = function(id) {
      return this.id = id;
    };

    NotFound.prototype.render = function() {
      this.$el.html(this.template({
        id: this.id,
        type: 'table',
        type_url: 'tables',
        type_all_url: 'tables'
      }));
      return this;
    };

    return NotFound;

  })(Backbone.View);
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.rename_namespace = __bind(this.rename_namespace, this);

      this.change_pinning = __bind(this.change_pinning, this);

      this.change_shards = __bind(this.change_shards, this);

      this.render = __bind(this.render, this);

      this.change_route = __bind(this.change_route, this);

      this.check_if_still_exists = __bind(this.check_if_still_exists, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.className = 'namespace-view';

    Container.prototype.template = Handlebars.templates['namespace_view-container-template'];

    Container.prototype.alert_tmpl = Handlebars.templates['modify_shards-alert-template'];

    Container.prototype.events = function() {
      return {
        'click .tab-link': 'change_route',
        'click .close': 'close_alert',
        'click .change_shards-link': 'change_shards',
        'click .operations .rename': 'rename_namespace',
        'click .operations .delete': 'delete_namespace'
      };
    };

    Container.prototype.initialize = function() {
      log_initial('(initializing) namespace view: container');
      this.model.load_key_distr();
      this.title = new NamespaceView.Title({
        model: this.model
      });
      this.profile = new NamespaceView.Profile({
        model: this.model
      });
      this.replicas = new NamespaceView.Replicas({
        model: this.model
      });
      this.secondary_indexes_view = new NamespaceView.SecondaryIndexesView({
        model: this.model
      });
      this.shards = new NamespaceView.Sharding({
        model: this.model
      });
      this.server_assignments = new NamespaceView.ServerAssignments({
        model: this.model
      });
      this.performance_graph = new Vis.OpsPlot(this.model.get_stats_for_performance, {
        width: 564,
        height: 210,
        seconds: 73,
        type: 'table'
      });
      return namespaces.on('remove', this.check_if_still_exists);
    };

    Container.prototype.check_if_still_exists = function() {
      var exist, namespace, _i, _len, _ref;
      exist = false;
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        if (namespace.get('id') === this.model.get('id')) {
          exist = true;
          break;
        }
      }
      if (exist === false) {
        window.router.navigate('#tables');
        return window.app.index_namespaces({
          alert_message: "The table <a href=\"#tables/" + (this.model.get('id')) + "\">" + (this.model.get('name')) + "</a> could not be found and was probably deleted."
        });
      }
    };

    Container.prototype.change_route = function(event) {
      return window.router.navigate(this.$(event.target).attr('href'));
    };

    Container.prototype.render = function() {
      log_render('(rendering) namespace view: container');
      this.$el.html(this.template({
        namespace_id: this.model.get('id')
      }));
      this.$('.main_title').html(this.title.render().$el);
      this.$('.profile').html(this.profile.render().$el);
      this.$('.performance-graph').html(this.performance_graph.render().$el);
      this.$('.replication').html(this.replicas.render().el);
      this.$('.sharding').html(this.shards.render().el);
      this.$('.server-assignments').html(this.server_assignments.render().el);
      this.$('.secondary_indexes').html(this.secondary_indexes_view.render().el);
      return this;
    };

    Container.prototype.close_alert = function(event) {
      event.preventDefault();
      return $(event.currentTarget).parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    Container.prototype.change_shards = function(event) {
      event.preventDefault();
      return this.$('#namespace-sharding-link').tab('show');
    };

    Container.prototype.change_pinning = function(event) {
      event.preventDefault();
      this.$('#namespace-pinning-link').tab('show');
      return $(event.currentTarget).parent().parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    Container.prototype.rename_namespace = function(event) {
      var rename_modal;
      event.preventDefault();
      rename_modal = new UIComponents.RenameItemModal(this.model.get('id'), 'table');
      return rename_modal.render();
    };

    Container.prototype.delete_namespace = function(event) {
      var namespace_to_delete, remove_namespace_dialog,
        _this = this;
      event.preventDefault();
      remove_namespace_dialog = new NamespaceView.RemoveNamespaceModal;
      namespace_to_delete = this.model;
      remove_namespace_dialog.on_success = function(response) {
        window.router.navigate('#tables');
        window.app.index_namespaces({
          alert_message: "The table " + (_this.model.get('name')) + " was successfully deleted."
        });
        return namespaces.remove(_this.model.get('id'));
      };
      return remove_namespace_dialog.render([this.model]);
    };

    Container.prototype.destroy = function() {
      namespaces.off('remove', this.check_if_still_exists);
      this.model.clear_timeout();
      this.title.destroy();
      this.profile.destroy();
      this.replicas.destroy();
      this.shards.destroy();
      this.server_assignments.destroy();
      this.performance_graph.destroy();
      return this.secondary_indexes_view.destroy();
    };

    return Container;

  })(Backbone.View);
  this.Title = (function(_super) {

    __extends(Title, _super);

    function Title() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.update = __bind(this.update, this);
      return Title.__super__.constructor.apply(this, arguments);
    }

    Title.prototype.className = 'namespace-info-view';

    Title.prototype.template = Handlebars.templates['namespace_view_title-template'];

    Title.prototype.initialize = function() {
      this.name = this.model.get('name');
      return this.model.on('change:name', this.update);
    };

    Title.prototype.update = function() {
      if (this.name !== this.model.get('name')) {
        this.name = this.model.get('name');
        return this.render();
      }
    };

    Title.prototype.render = function() {
      this.$el.html(this.template({
        name: this.name
      }));
      return this;
    };

    Title.prototype.destroy = function() {
      return this.model.off('change:name', this.update);
    };

    return Title;

  })(Backbone.View);
  this.Profile = (function(_super) {

    __extends(Profile, _super);

    function Profile() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);
      return Profile.__super__.constructor.apply(this, arguments);
    }

    Profile.prototype.className = 'namespace-profile';

    Profile.prototype.template = Handlebars.templates['namespace_view-profile-template'];

    Profile.prototype.initialize = function() {
      this.model.on('all', this.render);
      directory.on('all', this.render);
      progress_list.on('all', this.render);
      log_initial('(initializing) namespace view: replica');
      return this.data = {};
    };

    Profile.prototype.render = function() {
      var data, key, machine, _i, _len, _ref;
      data = DataUtils.get_namespace_status(this.model.get('id'));
      data.total_keys_available = false;
      if (this.model.get('key_distr') != null) {
        data.total_keys_available = true;
        data.total_keys = 0;
        for (key in this.model.get('key_distr')) {
          data.total_keys += parseInt(this.model.get('key_distr')[key]);
        }
      }
      if (data.total_keys_available === true && (data.total_keys != null) && data.total_keys === data.total_keys) {
        data.total_keys = DataUtils.approximate_count(data.total_keys);
      }
      data.stats_up_to_date = true;
      _ref = machines.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        if ((machine.get('stats') != null) && this.model.get('id') in machine.get('stats') && machine.is_reachable) {
          if (machine.get('stats_up_to_date') === false) {
            data.stats_up_to_date = false;
            break;
          }
        }
      }
      if (!_.isEqual(this.data, data)) {
        this.data = data;
        this.$el.html(this.template(data));
      }
      return this;
    };

    Profile.prototype.destroy = function() {
      this.model.off('all', this.render);
      directory.off('all', this.render);
      return progress_list.off('all', this.render);
    };

    return Profile;

  })(Backbone.View);
  return this.SecondaryIndexesView = (function(_super) {

    __extends(SecondaryIndexesView, _super);

    function SecondaryIndexesView() {
      this.destroy = __bind(this.destroy, this);

      this.on_create = __bind(this.on_create, this);

      this.create_index = __bind(this.create_index, this);

      this.handle_keypress = __bind(this.handle_keypress, this);

      this.on_fail_to_connect = __bind(this.on_fail_to_connect, this);

      this.on_index_list_repeat = __bind(this.on_index_list_repeat, this);

      this.on_index_list = __bind(this.on_index_list, this);

      this.get_indexes = __bind(this.get_indexes, this);

      this.set_interval_get_indexes = __bind(this.set_interval_get_indexes, this);

      this.render = __bind(this.render, this);

      this.render_content = __bind(this.render_content, this);

      this.hide_add_index = __bind(this.hide_add_index, this);

      this.show_add_index = __bind(this.show_add_index, this);

      this.on_drop = __bind(this.on_drop, this);

      this.delete_secondary_index = __bind(this.delete_secondary_index, this);

      this.confirm_delete = __bind(this.confirm_delete, this);

      this.save_name = __bind(this.save_name, this);

      this.init_connection = __bind(this.init_connection, this);

      this.initialize = __bind(this.initialize, this);
      return SecondaryIndexesView.__super__.constructor.apply(this, arguments);
    }

    SecondaryIndexesView.prototype.template = Handlebars.templates['namespace_view-secondary_indexes-template'];

    SecondaryIndexesView.prototype.content_template = Handlebars.templates['namespace_view-secondary_indexes-content-template'];

    SecondaryIndexesView.prototype.alert_message_template = Handlebars.templates['secondary_indexes-alert_msg-template'];

    SecondaryIndexesView.prototype.error_template = Handlebars.templates['secondary_indexes-error-template'];

    SecondaryIndexesView.prototype.events = {
      'click .delete_link': 'confirm_delete',
      'click .delete_index_btn': 'delete_secondary_index',
      'click .cancel_delete_btn': 'cancel_delete',
      'click .create_link': 'show_add_index',
      'click .create_btn': 'create_index',
      'keydown .secondary_index_name': 'handle_keypress',
      'click .cancel_btn': 'hide_add_index',
      'click .reconnect_link': 'init_connection',
      'click .close_hide': 'hide_alert'
    };

    SecondaryIndexesView.prototype.error_interval = 5 * 1000;

    SecondaryIndexesView.prototype.normal_interval = 60 * 1000;

    SecondaryIndexesView.prototype.initialize = function() {
      this.init_connection();
      this.secondary_indexes = null;
      return this.deleting_secondary_index = null;
    };

    SecondaryIndexesView.prototype.init_connection = function(event) {
      if (event != null) {
        event.preventDefault();
      }
      this.loading = true;
      this.driver_handler = new DataExplorerView.DriverHandler({
        on_success: this.set_interval_get_indexes,
        on_fail: this.on_fail_to_connect,
        dont_timeout_connection: true
      });
      this.secondary_indexes = null;
      this.deleting_secondary_index = null;
      this.db = databases.get(this.model.get('database'));
      this.db.on('change:name', this.save_name);
      this.model.on('change:name', this.save_name);
      return this.save_name();
    };

    SecondaryIndexesView.prototype.save_name = function() {
      this.table = this.model.get('name');
      return this.db_name = this.db.get('name');
    };

    SecondaryIndexesView.prototype.confirm_delete = function(event) {
      var deleting_secondary_index;
      event.preventDefault();
      deleting_secondary_index = this.$(event.target).data('name');
      this.adding_index = false;
      this.render_content();
      if (deleting_secondary_index !== this.deleting_secondary_index) {
        this.deleting_secondary_index = deleting_secondary_index;
        this.$('.alert_confirm_delete').slideUp('fast');
        return this.$('.alert_confirm_delete_' + this.deleting_secondary_index).slideDown('fast');
      }
    };

    SecondaryIndexesView.prototype.delete_secondary_index = function(event) {
      this.current_secondary_name = this.$(event.target).data('name');
      this.deleting_secondary_index = this.$(event.target).data('name');
      return r.db(this.db_name).table(this.table).indexDrop(this.current_secondary_name).private_run(this.driver_handler.connection, this.on_drop);
    };

    SecondaryIndexesView.prototype.on_drop = function(err, result) {
      if (this.current_secondary_name === this.deleting_secondary_index) {
        this.deleting_secondary_index = null;
      }
      if ((err != null) || (result != null ? result.dropped : void 0) !== 1) {
        this.loading = false;
        this.$('.alert_error_content').html(this.error_template({
          delete_fail: true,
          message: err.msg.replace('\n', '<br/>')
        }));
        this.$('.main_alert').slideUp('fast');
        this.$('.main_alert_error').slideDown('fast');
        return this.get_indexes();
      } else {
        this.get_indexes();
        this.$('.alert_content').html(this.alert_message_template({
          delete_ok: true,
          name: this.current_secondary_name
        }));
        this.$('.main_alert').slideDown('fast');
        return this.$('.main_alert_error').slideUp('fast');
      }
    };

    SecondaryIndexesView.prototype.show_add_index = function(event) {
      event.preventDefault();
      this.adding_index = true;
      this.deleting_secondary_index = null;
      this.render_content();
      return this.$('.alert_confirm_delete').slideUp('fast');
    };

    SecondaryIndexesView.prototype.hide_add_index = function() {
      this.adding_index = false;
      return this.render_content();
    };

    SecondaryIndexesView.prototype.render_content = function(args) {
      var mapped_secondary_indexes, template_args, that;
      that = this;
      if (!(args != null)) {
        args = {};
      }
      mapped_secondary_indexes = _.map(this.secondary_indexes, function(d) {
        return {
          name: d,
          display: that.deleting_secondary_index === d,
          is_empty: d === ''
        };
      });
      template_args = {
        loading: this.loading,
        secondary_indexes: mapped_secondary_indexes,
        no_secondary_indexes: (this.secondary_indexes != null) && this.secondary_indexes.length === 0,
        show_add_index: this.adding_index,
        secondary_index_name: this.secondary_index_name
      };
      this.$('.content').html(this.content_template(_.extend(template_args, args)));
      if (this.adding_index) {
        this.$('.secondary_index_name').focus();
      }
      return this.delegateEvents();
    };

    SecondaryIndexesView.prototype.render = function() {
      this.$el.html(this.template());
      this.render_content();
      return this;
    };

    SecondaryIndexesView.prototype.set_interval_get_indexes = function() {
      return this.get_indexes({
        set_timeout: true
      });
    };

    SecondaryIndexesView.prototype.get_indexes = function(args) {
      if ((args != null ? args.set_timeout : void 0) === true) {
        return r.db(this.db_name).table(this.table).indexList().private_run(this.driver_handler.connection, this.on_index_list_repeat);
      } else {
        return r.db(this.db_name).table(this.table).indexList().private_run(this.driver_handler.connection, this.on_index_list);
      }
    };

    SecondaryIndexesView.prototype.on_index_list = function(err, result) {
      var secondary_indexes;
      if (err != null) {
        this.loading = false;
        return this.render_content({
          error: true,
          index_list: true
        });
      } else {
        this.loading = false;
        secondary_indexes = result.sort();
        if (!_.isEqual(this.secondary_indexes, secondary_indexes)) {
          this.secondary_indexes = secondary_indexes;
          return this.render_content();
        }
      }
    };

    SecondaryIndexesView.prototype.on_index_list_repeat = function(err, result) {
      var secondary_indexes;
      if (err != null) {
        this.loading = false;
        this.render_content({
          error: true,
          index_list: true
        });
        return this.timeout = setTimeout(this.set_interval_get_indexes, this.error_interval);
      } else {
        this.loading = false;
        secondary_indexes = result.sort();
        if (!_.isEqual(this.secondary_indexes, secondary_indexes)) {
          this.secondary_indexes = secondary_indexes;
          this.render_content();
        }
        return this.timeout = setTimeout(this.set_interval_get_indexes, this.normal_interval);
      }
    };

    SecondaryIndexesView.prototype.on_fail_to_connect = function() {
      this.loading = false;
      this.$el.html(this.template({
        error: true,
        connect: true
      }));
      return this;
    };

    SecondaryIndexesView.prototype.handle_keypress = function(event) {
      if (event.which === 13) {
        event.preventDefault();
        return this.create_index();
      } else if (event.which === 27) {
        event.preventDefault();
        return this.hide_add_index();
      } else {
        return this.current_secondary_name = $('.secondary_index_name').val();
      }
    };

    SecondaryIndexesView.prototype.create_index = function() {
      this.current_secondary_name = $('.secondary_index_name').val();
      return r.db(this.db_name).table(this.table).indexCreate(this.current_secondary_name).private_run(this.driver_handler.connection, this.on_create);
    };

    SecondaryIndexesView.prototype.on_create = function(err, result) {
      var that;
      that = this;
      if (err != null) {
        this.$('.alert_error_content').html(this.error_template({
          create_fail: true,
          message: err.msg.replace('\n', '<br/>')
        }));
        this.$('.main_alert_error').slideDown('fast');
        return this.$('.main_alert').slideUp('fast');
      } else {
        this.adding_index = false;
        this.get_indexes();
        this.$('.alert_content').html(this.alert_message_template({
          create_ok: true,
          name: this.current_secondary_name
        }));
        this.$('.main_alert_error').slideUp('fast');
        return this.$('.main_alert').slideDown('fast');
      }
    };

    SecondaryIndexesView.prototype.hide_alert = function(event) {
      var _ref;
      if ((event != null) && (((_ref = this.$(event.target)) != null ? _ref.data('name') : void 0) != null)) {
        this.deleting_secondary_index = null;
      }
      event.preventDefault();
      return $(event.target).parent().slideUp('fast');
    };

    SecondaryIndexesView.prototype.cancel_delete = function(event) {
      var _ref;
      if ((event != null) && (((_ref = this.$(event.target)) != null ? _ref.data('name') : void 0) != null)) {
        this.deleting_secondary_index = null;
      }
      return this.$(event.target).parent().parent().slideUp('fast');
    };

    SecondaryIndexesView.prototype.destroy = function() {
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }
      this.db.off('change:name', this.save_name);
      return this.model.off('change:name', this.save_name);
    };

    return SecondaryIndexesView;

  })(Backbone.View);
});

module('ServerView', function() {
  this.DatacenterList = (function(_super) {

    __extends(DatacenterList, _super);

    function DatacenterList() {
      this.destroy = __bind(this.destroy, this);

      this.update_toolbar_buttons = __bind(this.update_toolbar_buttons, this);

      this.add_element = __bind(this.add_element, this);

      this.get_callbacks = __bind(this.get_callbacks, this);

      this.get_selected_machines = __bind(this.get_selected_machines, this);

      this.set_datacenter = __bind(this.set_datacenter, this);

      this.add_datacenter = __bind(this.add_datacenter, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return DatacenterList.__super__.constructor.apply(this, arguments);
    }

    DatacenterList.prototype.className = 'datacenters_list-container';

    DatacenterList.prototype.template = Handlebars.templates['server_list-template'];

    DatacenterList.prototype.cannot_change_datacenter_alert_template = Handlebars.templates['cannot_change_datacenter-alert-template'];

    DatacenterList.prototype.alert_message_template = Handlebars.templates['alert_message-template'];

    DatacenterList.prototype.events = {
      'click .add-datacenter': 'add_datacenter',
      'click .set-datacenter': 'set_datacenter',
      'click .close': 'remove_parent_alert'
    };

    DatacenterList.prototype.initialize = function() {
      this.add_datacenter_dialog = new ServerView.AddDatacenterModal;
      this.set_datacenter_dialog = new ServerView.SetDatacenterModal({
        model: this.model
      });
      this.unassigned_machines = new ServerView.UnassignedMachinesListElement;
      this.unassigned_machines.register_machine_callbacks(this.get_callbacks());
      return DatacenterList.__super__.initialize.call(this, datacenters, ServerView.DatacenterListElement, 'div.datacenters', {
        filter: function() {
          return true;
        },
        sort: function(a, b) {
          if (a.model.get('name') > b.model.get('name')) {
            return 1;
          } else if (a.model.get('name') < b.model.get('name')) {
            return -1;
          } else {
            return 0;
          }
        }
      }, 'server', 'datacenter');
    };

    DatacenterList.prototype.render = function(message) {
      DatacenterList.__super__.render.apply(this, arguments);
      this.$('.unassigned-machines').html(this.unassigned_machines.render().el);
      this.update_toolbar_buttons();
      if (message != null) {
        this.$('#user-alert-space').append(this.alert_message_template({
          message: message
        }));
      }
      return this;
    };

    DatacenterList.prototype.remove_parent_alert = function(event) {
      var element;
      event.preventDefault();
      element = $(event.target).parent();
      return element.slideUp('fast', function() {
        return element.remove();
      });
    };

    DatacenterList.prototype.add_datacenter = function(event) {
      log_action('add datacenter button clicked');
      this.add_datacenter_dialog.render();
      return event.preventDefault();
    };

    DatacenterList.prototype.set_datacenter = function(event) {
      log_action('set datacenter button clicked');
      if (!$(event.currentTarget).is(':disabled')) {
        this.set_datacenter_dialog.render(this.get_selected_machines());
      }
      return event.preventDefault();
    };

    DatacenterList.prototype.get_selected_machines = function() {
      var machine_list, machine_lists, selected_machines, _i, _len;
      machine_lists = _.map(this.element_views.concat(this.unassigned_machines), function(datacenter_list_element) {
        return datacenter_list_element.machine_list;
      });
      selected_machines = [];
      for (_i = 0, _len = machine_lists.length; _i < _len; _i++) {
        machine_list = machine_lists[_i];
        selected_machines = selected_machines.concat(machine_list.get_selected_elements());
      }
      return selected_machines;
    };

    DatacenterList.prototype.get_callbacks = function() {
      return [this.update_toolbar_buttons];
    };

    DatacenterList.prototype.add_element = function(element) {
      var datacenter_list_element;
      datacenter_list_element = DatacenterList.__super__.add_element.call(this, element);
      return datacenter_list_element.register_machine_callbacks(this.get_callbacks());
    };

    DatacenterList.prototype.update_toolbar_buttons = function() {
      var $button;
      $button = this.$('.actions-bar .btn.set-datacenter');
      return $button.prop('disabled', !(datacenters.length > 0 && this.get_selected_machines().length > 0));
    };

    DatacenterList.prototype.destroy = function() {
      DatacenterList.__super__.destroy.apply(this, arguments);
      return this.unassigned_machines.destroy();
    };

    return DatacenterList;

  })(UIComponents.AbstractList);
  this.DatacenterListElement = (function(_super) {

    __extends(DatacenterListElement, _super);

    function DatacenterListElement() {
      this.register_machine_callbacks = __bind(this.register_machine_callbacks, this);

      this.render_summary = __bind(this.render_summary, this);

      this.render = __bind(this.render, this);
      return DatacenterListElement.__super__.constructor.apply(this, arguments);
    }

    DatacenterListElement.prototype.template = Handlebars.templates['datacenter_list_element-template'];

    DatacenterListElement.prototype.summary_template = Handlebars.templates['datacenter_list_element-summary-template'];

    DatacenterListElement.prototype.className = 'element-container';

    DatacenterListElement.prototype.events = function() {
      return _.extend(DatacenterListElement.__super__.events.apply(this, arguments), {
        'click button.remove-datacenter': 'remove_datacenter',
        'click button.rename-datacenter': 'rename_datacenter'
      });
    };

    DatacenterListElement.prototype.initialize = function() {
      log_initial('(initializing) list view: datacenter');
      DatacenterListElement.__super__.initialize.apply(this, arguments);
      this.machine_list = new ServerView.MachineList(this.model.get('id'));
      this.remove_datacenter_dialog = new ServerView.RemoveDatacenterModal;
      this.callbacks = [];
      this.model.on('change', this.render_summary);
      directory.on('all', this.render_summary);
      return this.machine_list.on('need_render', this.render);
    };

    DatacenterListElement.prototype.render = function() {
      var callback, _i, _len, _ref;
      this.$el.html(this.template({
        no_machines: this.machine_list.get_length() === 0
      }));
      this.render_summary();
      this.$('.element-list-container').html(this.machine_list.render().el);
      _ref = this.callbacks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        callback();
      }
      DatacenterListElement.__super__.render.apply(this, arguments);
      return this;
    };

    DatacenterListElement.prototype.render_summary = function() {
      var json, machine_active_for_namespace, machine_uuid, namespace, peer_role, role, shard, _i, _len, _namespaces, _ref, _ref1, _ref2;
      json = _.extend(this.model.toJSON(), {
        status: DataUtils.get_datacenter_reachability(this.model.get('id')),
        primary_count: 0,
        secondary_count: 0
      });
      _namespaces = [];
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        _ref1 = namespace.get('blueprint').peers_roles;
        for (machine_uuid in _ref1) {
          peer_role = _ref1[machine_uuid];
          if (((_ref2 = machines.get(machine_uuid)) != null ? _ref2.get('datacenter_uuid') : void 0) && machines.get(machine_uuid).get('datacenter_uuid') === this.model.get('id')) {
            machine_active_for_namespace = false;
            for (shard in peer_role) {
              role = peer_role[shard];
              if (role === 'role_primary') {
                machine_active_for_namespace = true;
                json.primary_count += 1;
              }
              if (role === 'role_secondary') {
                machine_active_for_namespace = true;
                json.secondary_count += 1;
              }
            }
            if (machine_active_for_namespace) {
              _namespaces[_namespaces.length] = namespace;
            }
          }
        }
      }
      json.namespace_count = _.uniq(_namespaces).length;
      return this.$('.datacenter.summary').html(this.summary_template(json));
    };

    DatacenterListElement.prototype.remove_datacenter = function(event) {
      log_action('remove datacenter button clicked');
      if (!this.$(event.currentTarget).is(':disabled')) {
        this.remove_datacenter_dialog.render(this.model);
      }
      return event.preventDefault();
    };

    DatacenterListElement.prototype.rename_datacenter = function(event) {
      var rename_modal;
      event.preventDefault();
      rename_modal = new UIComponents.RenameItemModal(this.model.get('id'), 'datacenter');
      return rename_modal.render();
    };

    DatacenterListElement.prototype.register_machine_callbacks = function(callbacks) {
      this.callbacks = callbacks;
      return this.machine_list.register_machine_callbacks(callbacks);
    };

    DatacenterListElement.prototype.destroy = function() {
      var callback, _i, _len, _ref;
      _ref = this.callbacks;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        callback();
      }
      this.model.off('change', this.render_summary);
      directory.off('all', this.render_summary);
      return this.machine_list.off('need_render', this.render);
    };

    return DatacenterListElement;

  })(UIComponents.CollapsibleListElement);
  this.MachineList = (function(_super) {

    __extends(MachineList, _super);

    function MachineList() {
      this.call_all_callback = __bind(this.call_all_callback, this);

      this.bind_callbacks_to_machine = __bind(this.bind_callbacks_to_machine, this);

      this.register_machine_callbacks = __bind(this.register_machine_callbacks, this);

      this.add_element = __bind(this.add_element, this);

      this.render = __bind(this.render, this);

      this.check_machines = __bind(this.check_machines, this);

      this.get_selected_elements = __bind(this.get_selected_elements, this);

      this.get_length = __bind(this.get_length, this);
      return MachineList.__super__.constructor.apply(this, arguments);
    }

    MachineList.prototype.tagName = 'div';

    MachineList.prototype.template = Handlebars.templates['machine_list-template'];

    MachineList.prototype.empty_template = Handlebars.templates['empty_list-template'];

    MachineList.prototype.initialize = function(datacenter_uuid) {
      this.datacenter_uuid = datacenter_uuid;
      this.machines_in_datacenter = {};
      this.machine_views = [];
      this.callbacks = [];
      machines.on('all', this.check_machines);
      return this.check_machines();
    };

    MachineList.prototype.get_length = function() {
      return this.machine_views.length;
    };

    MachineList.prototype.get_selected_elements = function() {
      var selected_elements, view, _i, _len, _ref;
      selected_elements = [];
      _ref = this.machine_views;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        view = _ref[_i];
        if (view.selected) {
          selected_elements.push(view.model);
        }
      }
      return selected_elements;
    };

    MachineList.prototype.check_machines = function() {
      var i, machine, machine_id, machine_view, need_render, _i, _j, _len, _len1, _ref, _ref1, _ref2;
      need_render = false;
      _ref = machines.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        if (machine.get('datacenter_uuid') === this.datacenter_uuid && !(this.machines_in_datacenter[machine.get('id')] != null)) {
          this.machines_in_datacenter[machine.get('id')] = true;
          this.machine_views.push(new ServerView.MachineListElement({
            model: machine
          }));
          need_render = true;
        }
      }
      _ref1 = this.machines_in_datacenter;
      for (machine_id in _ref1) {
        machine = _ref1[machine_id];
        if (!(machines.get(machine_id) != null) || machines.get(machine_id).get('datacenter_uuid') !== this.datacenter_uuid) {
          this.machines_in_datacenter[machine_id] = void 0;
          _ref2 = this.machine_views;
          for (i = _j = 0, _len1 = _ref2.length; _j < _len1; i = ++_j) {
            machine_view = _ref2[i];
            if (machine_view.model.get('id') === machine_id) {
              this.machine_views.splice(i, 1);
              break;
            }
          }
          need_render = true;
        }
      }
      if (need_render === true) {
        return this.trigger('need_render');
      }
    };

    MachineList.prototype.render = function() {
      var machine_view, _i, _len, _ref;
      this.$el.html('');
      if (this.get_length() === 0) {
        this.$el.html(this.empty_template({
          element: 'machine',
          container: 'datacenter'
        }));
      } else {
        _ref = this.machine_views;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          machine_view = _ref[_i];
          this.$el.append(machine_view.render().$el);
        }
      }
      this.register_machine_callbacks(this.callbacks);
      this.delegateEvents();
      return this;
    };

    MachineList.prototype.add_element = function(element) {
      var machine_list_element;
      machine_list_element = MachineList.__super__.add_element.call(this, element);
      return this.bind_callbacks_to_machine(machine_list_element);
    };

    MachineList.prototype.register_machine_callbacks = function(callbacks) {
      var machine_list_element, _i, _len, _ref, _results;
      this.callbacks = callbacks;
      _ref = this.machine_views;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine_list_element = _ref[_i];
        _results.push(this.bind_callbacks_to_machine(machine_list_element));
      }
      return _results;
    };

    MachineList.prototype.bind_callbacks_to_machine = function(machine_list_element) {
      machine_list_element.off('selected', this.call_all_callback);
      return machine_list_element.on('selected', this.call_all_callback);
    };

    MachineList.prototype.call_all_callback = function() {
      var callback, _i, _len, _ref, _results;
      _ref = this.callbacks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback());
      }
      return _results;
    };

    MachineList.prototype.destroy = function() {
      return machines.on('all', this.check_machines);
    };

    return MachineList;

  })(Backbone.View);
  this.MachineListElement = (function(_super) {

    __extends(MachineListElement, _super);

    function MachineListElement() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.render_status = __bind(this.render_status, this);

      this.render_info = __bind(this.render_info, this);

      this.render_name = __bind(this.render_name, this);

      this.json_for_template = __bind(this.json_for_template, this);

      this.initialize = __bind(this.initialize, this);
      return MachineListElement.__super__.constructor.apply(this, arguments);
    }

    MachineListElement.prototype.template = Handlebars.templates['machine_list_element-template'];

    MachineListElement.prototype.status_template = Handlebars.templates['machine_list_element-status-template'];

    MachineListElement.prototype.quick_info_template = Handlebars.templates['machine_list_element-quick_info-template'];

    MachineListElement.prototype.tagName = 'div';

    MachineListElement.prototype.initialize = function() {
      this.model.on('change:name', this.render);
      directory.on('all', this.render_status);
      namespaces.on('all', this.render_info);
      return MachineListElement.__super__.initialize.call(this, this.template);
    };

    MachineListElement.prototype.json_for_template = function() {
      var data;
      data = {
        id: this.model.get('id'),
        name: this.model.get('name')
      };
      return data;
    };

    MachineListElement.prototype.render_name = function() {
      return this.$('name-link').html(this.model.get('name'));
    };

    MachineListElement.prototype.render_info = function() {
      var data, machine_active_for_namespace, machine_uuid, namespace, peer_role, role, shard, _i, _len, _ref, _ref1;
      data = {
        primary_count: 0,
        secondary_count: 0,
        namespace_count: 0
      };
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        _ref1 = namespace.get('blueprint').peers_roles;
        for (machine_uuid in _ref1) {
          peer_role = _ref1[machine_uuid];
          if (machine_uuid === this.model.get('id')) {
            machine_active_for_namespace = false;
            for (shard in peer_role) {
              role = peer_role[shard];
              if (role === 'role_primary') {
                machine_active_for_namespace = true;
                data.primary_count += 1;
              }
              if (role === 'role_secondary') {
                machine_active_for_namespace = true;
                data.secondary_count += 1;
              }
            }
            if (machine_active_for_namespace === true) {
              data.namespace_count++;
            }
          }
        }
      }
      return this.$('.quick_info').html(this.quick_info_template(data));
    };

    MachineListElement.prototype.render_status = function() {
      return this.$('.status').html(this.status_template({
        status: DataUtils.get_machine_reachability(this.model.get('id'))
      }));
    };

    MachineListElement.prototype.render = function() {
      MachineListElement.__super__.render.apply(this, arguments);
      this.render_info();
      this.render_status();
      return this;
    };

    MachineListElement.prototype.destroy = function() {
      this.model.on('change:name', this.render);
      directory.on('all', this.render_status);
      return namespaces.on('all', this.render_info);
    };

    return MachineListElement;

  })(UIComponents.CheckboxListElement);
  this.UnassignedMachinesListElement = (function(_super) {

    __extends(UnassignedMachinesListElement, _super);

    function UnassignedMachinesListElement() {
      this.destroy = __bind(this.destroy, this);

      this.register_machine_callbacks = __bind(this.register_machine_callbacks, this);

      this.render = __bind(this.render, this);
      return UnassignedMachinesListElement.__super__.constructor.apply(this, arguments);
    }

    UnassignedMachinesListElement.prototype.template = Handlebars.templates['unassigned_machines_list_element-template'];

    UnassignedMachinesListElement.prototype.className = 'unassigned-machines element-container';

    UnassignedMachinesListElement.prototype.initialize = function() {
      UnassignedMachinesListElement.__super__.initialize.apply(this, arguments);
      this.machine_list = new ServerView.MachineList(universe_datacenter.get('id'));
      this.callbacks = [];
      return this.machine_list.on('need_render', this.render);
    };

    UnassignedMachinesListElement.prototype.render = function() {
      this.$el.html(this.template({
        no_machines: this.machine_list.get_length() === 0
      }));
      this.$('.element-list-container').html(this.machine_list.render().el);
      UnassignedMachinesListElement.__super__.render.apply(this, arguments);
      return this;
    };

    UnassignedMachinesListElement.prototype.register_machine_callbacks = function(callbacks) {
      this.callbacks = callbacks;
      return this.machine_list.register_machine_callbacks(callbacks);
    };

    UnassignedMachinesListElement.prototype.destroy = function() {
      return this.machine_list.off('need_render', this.render);
    };

    return UnassignedMachinesListElement;

  })(UIComponents.CollapsibleListElement);
  this.AddDatacenterModal = (function(_super) {

    __extends(AddDatacenterModal, _super);

    function AddDatacenterModal() {
      return AddDatacenterModal.__super__.constructor.apply(this, arguments);
    }

    AddDatacenterModal.prototype.template = Handlebars.templates['add_datacenter-modal-template'];

    AddDatacenterModal.prototype.alert_tmpl = Handlebars.templates['added_datacenter-alert-template'];

    AddDatacenterModal.prototype.error_template = Handlebars.templates['error_input-template'];

    AddDatacenterModal.prototype["class"] = 'add-datacenter';

    AddDatacenterModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: add datacenter');
      return AddDatacenterModal.__super__.initialize.apply(this, arguments);
    };

    AddDatacenterModal.prototype.render = function() {
      log_render('(rendering) add datacenter dialog');
      AddDatacenterModal.__super__.render.call(this, {
        modal_title: "Add datacenter",
        btn_primary_text: "Add"
      });
      return this.$('.focus_new_name').focus();
    };

    AddDatacenterModal.prototype.on_submit = function() {
      var datacenter, no_error, _i, _len, _ref;
      AddDatacenterModal.__super__.on_submit.apply(this, arguments);
      this.formdata = form_data_as_object($('form', this.$modal));
      no_error = true;
      if (this.formdata.name === '') {
        no_error = false;
        $('.alert_modal').html(this.error_template({
          datacenter_is_empty: true
        }));
      } else if (/^[a-zA-Z0-9_]+$/.test(this.formdata.name) === false) {
        no_error = false;
        $('.alert_modal').html(this.error_template({
          special_char_detected: true,
          type: 'datacenter'
        }));
      } else {
        _ref = datacenters.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          datacenter = _ref[_i];
          if (datacenter.get('name').toLowerCase() === this.formdata.name.toLowerCase()) {
            no_error = false;
            $('.alert_modal').html(this.error_template({
              datacenter_exists: true
            }));
            break;
          }
        }
      }
      if (no_error === true) {
        return $.ajax({
          processData: false,
          url: 'ajax/semilattice/datacenters/new',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            "name": this.formdata.name
          }),
          success: this.on_success,
          error: this.on_error
        });
      } else {
        $('.alert_modal_content').slideDown('fast');
        return this.reset_buttons();
      }
    };

    AddDatacenterModal.prototype.on_success = function(response) {
      var blah, response_uuid;
      AddDatacenterModal.__super__.on_success.apply(this, arguments);
      apply_to_collection(datacenters, response);
      for (response_uuid in response) {
        blah = response[response_uuid];
        break;
      }
      return $('#user-alert-space').append(this.alert_tmpl({
        name: this.formdata.name,
        uuid: response_uuid
      }));
    };

    return AddDatacenterModal;

  })(UIComponents.AbstractModal);
  this.RemoveDatacenterModal = (function(_super) {

    __extends(RemoveDatacenterModal, _super);

    function RemoveDatacenterModal() {
      this.on_success_with_error = __bind(this.on_success_with_error, this);

      this.delete_datacenter = __bind(this.delete_datacenter, this);

      this.remove_responsabilities = __bind(this.remove_responsabilities, this);

      this.unassign_machines_in_datacenter = __bind(this.unassign_machines_in_datacenter, this);
      return RemoveDatacenterModal.__super__.constructor.apply(this, arguments);
    }

    RemoveDatacenterModal.prototype.template = Handlebars.templates['remove_datacenter-modal-template'];

    RemoveDatacenterModal.prototype.alert_tmpl = Handlebars.templates['removed_datacenter-alert-template'];

    RemoveDatacenterModal.prototype.template_remove_error = Handlebars.templates['fail_delete_datacenter-template'];

    RemoveDatacenterModal.prototype["class"] = 'remove-datacenter';

    RemoveDatacenterModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: remove datacenter');
      return RemoveDatacenterModal.__super__.initialize.apply(this, arguments);
    };

    RemoveDatacenterModal.prototype.render = function(datacenter) {
      var namespaces_where_primary;
      log_render('(rendering) remove datacenters dialog');
      this.datacenter = datacenter;
      namespaces_where_primary = namespaces.filter(function(namespace) {
        return namespace.get('primary_uuid') === datacenter.get('id');
      });
      namespaces_where_primary = _.map(namespaces_where_primary, function(namespace) {
        return {
          id: namespace.get('id'),
          name: namespace.get('name')
        };
      });
      return RemoveDatacenterModal.__super__.render.call(this, {
        datacenter: datacenter.toJSON(),
        modal_title: "Delete datacenter",
        btn_primary_text: 'Delete',
        datacenter_is_primary: namespaces_where_primary.length > 0,
        namespaces_where_primary: namespaces_where_primary
      });
    };

    RemoveDatacenterModal.prototype.on_submit = function() {
      var machine, _i, _len, _ref;
      RemoveDatacenterModal.__super__.on_submit.apply(this, arguments);
      this.machines_to_delete = {};
      _ref = machines.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        if (machine.get('datacenter_uuid') === this.datacenter.id) {
          this.machines_to_delete[machine.get('id')] = {
            datacenter_uuid: universe_datacenter.get('id')
          };
        }
      }
      return this.unassign_machines_in_datacenter();
    };

    RemoveDatacenterModal.prototype.unassign_machines_in_datacenter = function() {
      return $.ajax({
        url: "ajax/semilattice/machines",
        type: 'POST',
        data: JSON.stringify(this.machines_to_delete),
        contentType: 'application/json',
        success: this.remove_responsabilities,
        error: this.on_error
      });
    };

    RemoveDatacenterModal.prototype.remove_responsabilities = function() {
      var namespace, namespaces_to_update, new_ack_expectations, new_replica_affinities, _i, _len, _ref;
      namespaces_to_update = {};
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        new_replica_affinities = namespace.get('replica_affinities');
        new_replica_affinities[this.datacenter.get('id')] = 0;
        new_ack_expectations = namespace.get('ack_expectations');
        new_ack_expectations[this.datacenter.get('id')] = {
          expectation: 0,
          hard_durability: namespace.get_durability()
        };
        if (namespace.get('primary_uuid') === this.datacenter.get('id')) {
          namespaces_to_update[namespace.get('id')] = {
            primary_uuid: universe_datacenter.get('id')
          };
        } else {
          namespaces_to_update[namespace.get('id')] = {};
        }
        if (namespace.get('primary_uuid') === this.datacenter.get('id')) {
          if (!(new_replica_affinities[universe_datacenter.get('id')] != null)) {
            new_replica_affinities[universe_datacenter.get('id')] = 0;
          }
          if (!(new_ack_expectations[universe_datacenter.get('id')] != null) || new_ack_expectations[universe_datacenter.get('id')].expectation === 0) {
            new_ack_expectations[universe_datacenter.get('id')] = {
              expectation: 1,
              hard_durability: namespace.get_durability()
            };
          }
        }
        namespaces_to_update[namespace.get('id')]['replica_affinities'] = new_replica_affinities;
        namespaces_to_update[namespace.get('id')]['ack_expectations'] = new_ack_expectations;
      }
      return $.ajax({
        url: "ajax/semilattice/rdb_namespaces",
        type: 'POST',
        data: JSON.stringify(namespaces_to_update),
        contentType: 'application/json',
        success: this.delete_datacenter,
        error: this.on_error
      });
    };

    RemoveDatacenterModal.prototype.delete_datacenter = function() {
      var machine_id;
      for (machine_id in this.machines_to_delete) {
        machines.get(machine_id).set('datacenter_uuid', universe_datacenter.get('id'));
      }
      return $.ajax({
        url: "ajax/semilattice/datacenters/" + this.datacenter.id,
        type: 'DELETE',
        contentType: 'application/json',
        success: this.on_success,
        error: this.on_error
      });
    };

    RemoveDatacenterModal.prototype.on_success_with_error = function() {
      this.$('.error_answer').html(this.template_remove_error);
      if (this.$('.error_answer').css('display') === 'none') {
        this.$('.error_answer').slideDown('fast');
      } else {
        this.$('.error_answer').css('display', 'none');
        this.$('.error_answer').fadeIn();
      }
      return this.reset_buttons();
    };

    RemoveDatacenterModal.prototype.on_success = function(response) {
      var name;
      if (response) {
        this.on_success_with_error();
        return;
      }
      name = this.datacenter.get('name');
      datacenters.remove(this.datacenter.id);
      RemoveDatacenterModal.__super__.on_success.apply(this, arguments);
      if (/^(datacenters)/.test(Backbone.history.fragment === true)) {
        window.router.navigate('#servers');
        return window.app.index_servers({
          alert_message: "The datacenter " + name + " was successfully deleted."
        });
      } else {
        return $('#user-alert-space').append(this.alert_tmpl({
          name: this.datacenter.get('name')
        }));
      }
    };

    return RemoveDatacenterModal;

  })(UIComponents.AbstractModal);
  return this.SetDatacenterModal = (function(_super) {

    __extends(SetDatacenterModal, _super);

    function SetDatacenterModal() {
      this.on_success = __bind(this.on_success, this);
      return SetDatacenterModal.__super__.constructor.apply(this, arguments);
    }

    SetDatacenterModal.prototype.template = Handlebars.templates['set_datacenter-modal-template'];

    SetDatacenterModal.prototype.cannot_change_datacenter_alert_template = Handlebars.templates['cannot_change_datacenter-alert_content-template'];

    SetDatacenterModal.prototype.alert_tmpl = Handlebars.templates['set_datacenter-alert-template'];

    SetDatacenterModal.prototype["class"] = 'set-datacenter-modal';

    SetDatacenterModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: set datacenter');
      return SetDatacenterModal.__super__.initialize.apply(this, arguments);
    };

    SetDatacenterModal.prototype.render = function(_machines_list) {
      var data, datacenter, machine, new_data, warnings_by_machines, _i, _len, _ref;
      this.machines_list = _machines_list;
      log_render('(rendering) set datacenter dialog');
      data = {
        modal_title: 'Set datacenter',
        btn_primary_text: 'Commit',
        datacenters: (function() {
          var _i, _len, _ref, _results;
          _ref = datacenters.models;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            datacenter = _ref[_i];
            _results.push(datacenter.toJSON());
          }
          return _results;
        })()
      };
      warnings_by_machines = [];
      _ref = this.machines_list;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        new_data = machine.get_data_for_moving();
        if (new_data.has_warning === true) {
          warnings_by_machines.push(new_data);
        }
      }
      if (warnings_by_machines.length > 0) {
        data.has_warning = true;
        data.warnings_by_machines = warnings_by_machines;
      }
      return SetDatacenterModal.__super__.render.call(this, data);
    };

    SetDatacenterModal.prototype.on_submit = function() {
      var json, _i, _len, _m, _ref;
      SetDatacenterModal.__super__.on_submit.apply(this, arguments);
      this.formdata = form_data_as_object($('form', this.$modal));
      json = {};
      _ref = this.machines_list;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _m = _ref[_i];
        json[_m.get('id')] = {
          datacenter_uuid: this.formdata.datacenter_uuid
        };
      }
      return $.ajax({
        processData: false,
        url: "ajax/semilattice/machines",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(json),
        success: this.on_success,
        error: this.on_error
      });
    };

    SetDatacenterModal.prototype.on_success = function(response) {
      var machine_names, _m, _m_uuid;
      SetDatacenterModal.__super__.on_success.apply(this, arguments);
      for (_m_uuid in response) {
        _m = response[_m_uuid];
        if (machines.get(_m_uuid) != null) {
          machines.get(_m_uuid).set(_m);
        }
      }
      machine_names = _.map(this.machines_list, function(_m) {
        return {
          name: _m.get('name')
        };
      });
      return $('#user-alert-space').append(this.alert_tmpl({
        datacenter_name: datacenters.get(this.formdata.datacenter_uuid).get('name'),
        machines_first: machine_names[0],
        machines_rest: machine_names.splice(1),
        machine_count: this.machines_list.length
      }));
    };

    return SetDatacenterModal;

  })(UIComponents.AbstractModal);
});

module('MachineView', function() {
  this.NotFound = (function(_super) {

    __extends(NotFound, _super);

    function NotFound() {
      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return NotFound.__super__.constructor.apply(this, arguments);
    }

    NotFound.prototype.template = Handlebars.templates['element_view-not_found-template'];

    NotFound.prototype.ghost_template = Handlebars.templates['machine_view-ghost-template'];

    NotFound.prototype.initialize = function(id) {
      return this.id = id;
    };

    NotFound.prototype.render = function() {
      var issue, _i, _len, _ref;
      if (directory.get(this.id) != null) {
        _ref = issues.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          issue = _ref[_i];
          if (issue.get('type') === 'MACHINE_GHOST' && issue.get('ghost') === this.id) {
            this.$el.html(this.ghost_template({
              id: this.id,
              ips: directory.get(this.id).get('ips')
            }));
            return this;
          }
        }
        this.$el.html(this.template({
          id: this.id,
          type: 'server',
          type_url: 'servers',
          type_all_url: 'servers'
        }));
      } else {
        this.$el.html(this.template({
          id: this.id,
          type: 'server',
          type_url: 'servers',
          type_all_url: 'servers'
        }));
      }
      return this;
    };

    return NotFound;

  })(Backbone.View);
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.unassign_datacenter = __bind(this.unassign_datacenter, this);

      this.change_datacenter = __bind(this.change_datacenter, this);

      this.rename_machine = __bind(this.rename_machine, this);

      this.render_can_unassign_button = __bind(this.render_can_unassign_button, this);

      this.render = __bind(this.render, this);

      this.change_route = __bind(this.change_route, this);

      this.check_if_still_exists = __bind(this.check_if_still_exists, this);

      this.initialize = __bind(this.initialize, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.className = 'machine-view';

    Container.prototype.template = Handlebars.templates['machine_view-container-template'];

    Container.prototype.events = function() {
      return {
        'click .close': 'close_alert',
        'click .tab-link': 'change_route',
        'click .operations .rename': 'rename_machine',
        'click .operations .change-datacenter': 'change_datacenter',
        'click .operations .unassign-datacenter': 'unassign_datacenter'
      };
    };

    Container.prototype.initialize = function() {
      log_initial('(initializing) machine view: container');
      this.title = new MachineView.Title({
        model: this.model
      });
      this.profile = new MachineView.Profile({
        model: this.model
      });
      this.performance_graph = new Vis.OpsPlot(this.model.get_stats_for_performance, {
        width: 564,
        height: 210,
        seconds: 73,
        type: 'server'
      });
      this.data = new MachineView.Data({
        model: this.model
      });
      this.logs = new LogView.Container({
        route: "ajax/log/" + this.model.get('id') + "?",
        type: 'machine'
      });
      machines.on('remove', this.check_if_still_exists);
      return this.model.on('change:datacenter_uuid', this.render_can_unassign_button);
    };

    Container.prototype.check_if_still_exists = function() {
      var exist, machine, _i, _len, _ref;
      exist = false;
      _ref = machines.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        if (machine.get('id') === this.model.get('id')) {
          exist = true;
          break;
        }
      }
      if (exist === false) {
        window.router.navigate('#servers');
        return window.app.index_servers({
          alert_message: "The server <a href=\"#servers/" + (this.model.get('id')) + "\">" + (this.model.get('name')) + "</a> could not be found and was probably deleted."
        });
      }
    };

    Container.prototype.change_route = function(event) {
      return window.router.navigate(this.$(event.target).attr('href'));
    };

    Container.prototype.render = function(tab) {
      log_render('(rendering) machine view: container');
      this.$el.html(this.template({
        server_id: this.model.get('id')
      }));
      this.$('.main_title').html(this.title.render().$el);
      this.$('.profile').html(this.profile.render().$el);
      this.$('.performance-graph').html(this.performance_graph.render().$el);
      this.$('.server-data').html(this.data.render().$el);
      this.$('.recent-log-entries').html(this.logs.render().$el);
      this.render_can_unassign_button();
      return this;
    };

    Container.prototype.render_can_unassign_button = function() {
      if ((this.model.get('datacenter_uuid') != null) && this.model.get('datacenter_uuid') !== universe_datacenter.get('id')) {
        return this.$('.unassign-datacenter_li').show();
      } else {
        return this.$('.unassign-datacenter_li').hide();
      }
    };

    Container.prototype.close_alert = function(event) {
      event.preventDefault();
      return $(event.currentTarget).parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    Container.prototype.rename_machine = function(event) {
      var rename_modal;
      event.preventDefault();
      rename_modal = new UIComponents.RenameItemModal(this.model.get('id'), 'server');
      return rename_modal.render();
    };

    Container.prototype.change_datacenter = function(event) {
      var set_datacenter_modal;
      event.preventDefault();
      set_datacenter_modal = new ServerView.SetDatacenterModal;
      return set_datacenter_modal.render([this.model]);
    };

    Container.prototype.unassign_datacenter = function(event) {
      var unassign_dialog;
      event.preventDefault();
      unassign_dialog = new MachineView.UnassignModal({
        model: this.model
      });
      return unassign_dialog.render();
    };

    Container.prototype.destroy = function() {
      machines.off('remove', this.check_if_still_exists);
      this.model.off('change:datacenter_uuid', this.render_can_unassign_button);
      this.title.destroy();
      this.profile.destroy();
      this.performance_graph.destroy();
      this.data.destroy();
      this.logs.destroy();
      return this.model.off('', this.render_can_unassign_button);
    };

    return Container;

  })(Backbone.View);
  this.Title = (function(_super) {

    __extends(Title, _super);

    function Title() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.update = __bind(this.update, this);
      return Title.__super__.constructor.apply(this, arguments);
    }

    Title.prototype.className = 'machine-info-view';

    Title.prototype.template = Handlebars.templates['machine_view_title-template'];

    Title.prototype.initialize = function() {
      this.name = this.model.get('name');
      return this.model.on('change:name', this.update);
    };

    Title.prototype.update = function() {
      if (this.name !== this.model.get('name')) {
        this.name = this.model.get('name');
        return this.render();
      }
    };

    Title.prototype.render = function() {
      this.$el.html(this.template({
        name: this.name
      }));
      return this;
    };

    Title.prototype.destroy = function() {
      return this.model.off('change:name', this.update);
    };

    return Title;

  })(Backbone.View);
  this.Profile = (function(_super) {

    __extends(Profile, _super);

    function Profile() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Profile.__super__.constructor.apply(this, arguments);
    }

    Profile.prototype.className = 'machine-info-view';

    Profile.prototype.template = Handlebars.templates['machine_view_profile-template'];

    Profile.prototype.initialize = function() {
      directory.on('all', this.render);
      this.model.on('all', this.render);
      return this.data = {};
    };

    Profile.prototype.render = function() {
      var data, datacenter_name, ips, main_ip;
      ips = directory.get(this.model.get('id')) != null ? directory.get(this.model.get('id')).get('ips') : null;
      if ((ips != null) && (ips[0] != null)) {
        main_ip = ips[0];
      }
      if (this.model.get('datacenter_uuid') !== universe_datacenter.get('id')) {
        if (datacenters.get(this.model.get('datacenter_uuid')) != null) {
          datacenter_name = datacenters.get(this.model.get('datacenter_uuid')).get('name');
        } else {
          datacenter_name = 'Not found datacenter';
        }
      }
      data = {
        main_ip: main_ip,
        uptime: this.model.get_stats().proc.uptime != null ? $.timeago(new Date(Date.now() - this.model.get_stats().proc.uptime * 1000)).slice(0, -4) : "N/A",
        assigned_to_datacenter: this.model.get('datacenter_uuid') !== universe_datacenter.get('id'),
        reachability: DataUtils.get_machine_reachability(this.model.get('id')),
        datacenter_name: (datacenter_name != null ? datacenter_name : void 0)
      };
      if (!_.isEqual(this.data, data)) {
        this.data = data;
        this.$el.html(this.template(this.data));
      }
      return this;
    };

    Profile.prototype.destroy = function() {
      directory.off('all', this.render);
      return this.model.off('all', this.render);
    };

    return Profile;

  })(Backbone.View);
  this.UnassignModal = (function(_super) {

    __extends(UnassignModal, _super);

    function UnassignModal() {
      this.on_success = __bind(this.on_success, this);

      this.on_submit = __bind(this.on_submit, this);

      this.render = __bind(this.render, this);
      return UnassignModal.__super__.constructor.apply(this, arguments);
    }

    UnassignModal.prototype.template = Handlebars.templates['unassign-modal-template'];

    UnassignModal.prototype.alert_tmpl = Handlebars.templates['unassign-alert-template'];

    UnassignModal.prototype["class"] = 'unassign-dialog';

    UnassignModal.prototype.initialize = function() {
      return UnassignModal.__super__.initialize.apply(this, arguments);
    };

    UnassignModal.prototype.render = function() {
      var data;
      data = {
        modal_title: 'Remove datacenter',
        btn_primary_text: 'Remove',
        id: this.model.get('id'),
        name: this.model.get('name')
      };
      _.extend(data, this.model.get_data_for_moving());
      UnassignModal.__super__.render.call(this, data);
      if (data.has_warning === false) {
        return this.$('.btn-primary').focus();
      }
    };

    UnassignModal.prototype.on_submit = function() {
      UnassignModal.__super__.on_submit.apply(this, arguments);
      return $.ajax({
        url: "ajax/semilattice/machines/" + this.model.get('id') + "/datacenter_uuid",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(null),
        dataType: 'json',
        success: this.on_success,
        error: this.on_error
      });
    };

    UnassignModal.prototype.on_success = function(response) {
      machines.get(this.model.get('id')).set('datacenter_uuid', null);
      $('#user-alert-space').html(this.alert_tmpl);
      return clear_modals();
    };

    return UnassignModal;

  })(UIComponents.AbstractModal);
  return this.Data = (function(_super) {

    __extends(Data, _super);

    function Data() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Data.__super__.constructor.apply(this, arguments);
    }

    Data.prototype.template = Handlebars.templates['machine_view_data-template'];

    Data.prototype.initialize = function() {
      this.namespaces_with_listeners = {};
      namespaces.on('change:blueprint', this.render);
      namespaces.on('change:key_distr', this.render);
      namespaces.each(function(namespace) {
        return namespace.load_key_distr();
      });
      return this.data = {};
    };

    Data.prototype.render = function() {
      var data, data_by_namespace,
        _this = this;
      data_by_namespace = [];
      namespaces.each(function(namespace) {
        var json_shard, keys, machine_id, ns, peer_roles, role, shard, _ref;
        ns = {
          name: namespace.get('name'),
          id: namespace.get('id'),
          shards: []
        };
        _ref = namespace.get('blueprint').peers_roles;
        for (machine_id in _ref) {
          peer_roles = _ref[machine_id];
          if (machine_id === _this.model.get('id')) {
            for (shard in peer_roles) {
              role = peer_roles[shard];
              if (role !== 'role_nothing') {
                keys = namespace.compute_shard_rows_approximation(shard);
                json_shard = $.parseJSON(shard);
                ns.shards.push({
                  name: human_readable_shard(shard),
                  shard: human_readable_shard_obj(shard),
                  num_keys: keys,
                  role: role,
                  secondary: role === 'role_secondary',
                  primary: role === 'role_primary'
                });
              }
            }
          }
        }
        if (ns.shards.length > 0) {
          return data_by_namespace.push(ns);
        }
      });
      data = {
        has_data: data_by_namespace.length > 0,
        tables: _.sortBy(data_by_namespace, function(namespace) {
          return namespace.name;
        })
      };
      if (!_.isEqual(data, this.data)) {
        this.data = data;
        this.$el.html(this.template(this.data));
      }
      return this;
    };

    Data.prototype.destroy = function() {
      namespaces.off('change:blueprint', this.render);
      return namespaces.off('change:key_distr', this.render);
    };

    return Data;

  })(Backbone.View);
});

module('DatacenterView', function() {
  this.NotFound = (function(_super) {

    __extends(NotFound, _super);

    function NotFound() {
      this.render = __bind(this.render, this);
      return NotFound.__super__.constructor.apply(this, arguments);
    }

    NotFound.prototype.template = Handlebars.templates['element_view-not_found-template'];

    NotFound.prototype.initialize = function(id) {
      return this.id = id;
    };

    NotFound.prototype.render = function() {
      this.$el.html(this.template({
        id: this.id,
        type: 'datacenter',
        type_url: 'datacenters',
        type_all_url: 'servers'
      }));
      return this;
    };

    return NotFound;

  })(Backbone.View);
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.rename_datacenter = __bind(this.rename_datacenter, this);

      this.render = __bind(this.render, this);

      this.change_route = __bind(this.change_route, this);

      this.check_if_still_exists = __bind(this.check_if_still_exists, this);

      this.initialize = __bind(this.initialize, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.className = 'datacenter-view';

    Container.prototype.template = Handlebars.templates['datacenter_view-container-template'];

    Container.prototype.events = function() {
      return {
        'click .tab-link': 'change_route',
        'click .close': 'close_alert',
        'click .operations .rename': 'rename_datacenter',
        'click .operations .delete': 'delete_datacenter'
      };
    };

    Container.prototype.max_log_entries_to_render = 3;

    Container.prototype.initialize = function() {
      var filter, machine, _i, _len, _ref;
      log_initial('(initializing) datacenter view: container');
      this.title = new DatacenterView.Title({
        model: this.model
      });
      this.profile = new DatacenterView.Profile({
        model: this.model
      });
      this.machine_list = new DatacenterView.MachineList({
        model: this.model
      });
      this.performance_graph = new Vis.OpsPlot(this.model.get_stats_for_performance, {
        width: 564,
        height: 210,
        seconds: 73,
        type: 'datacenter'
      });
      filter = {};
      _ref = machines.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        if (machine.get('datacenter_uuid') === this.model.get('id')) {
          filter[machine.get('id')] = true;
        }
      }
      this.logs = new LogView.Container({
        filter: filter,
        type: 'datacenter'
      });
      return datacenters.on('remove', this.check_if_still_exists);
    };

    Container.prototype.check_if_still_exists = function() {
      var datacenter, exist, _i, _len, _ref;
      exist = false;
      _ref = datacenters.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        datacenter = _ref[_i];
        if (datacenter.get('id') === this.model.get('id')) {
          exist = true;
          break;
        }
      }
      if (exist === false) {
        window.router.navigate('#servers');
        return window.app.index_servers({
          alert_message: "The datacenter <a href=\"#datacenters/" + (this.model.get('id')) + "\">" + (this.model.get('name')) + "</a> could not be found and was probably deleted."
        });
      }
    };

    Container.prototype.change_route = function(event) {
      return window.router.navigate(this.$(event.target).attr('href'));
    };

    Container.prototype.render = function(tab) {
      var machines_in_datacenter,
        _this = this;
      log_render('(rendering) datacenter view: container');
      this.$el.html(this.template({
        datacenter_id: this.model.get('id')
      }));
      this.$('.main_title').html(this.title.render().$el);
      this.$('.profile').html(this.profile.render().$el);
      this.$('.performance-graph').html(this.performance_graph.render().$el);
      this.$('.server-list').html(this.machine_list.render().$el);
      this.$('.performance-graph').html(this.performance_graph.render().$el);
      machines_in_datacenter = machines.filter(function(machine) {
        return machine.get('datacenter_uuid') === _this.model.get('id');
      });
      this.$('.recent-log-entries').html(this.logs.render().$el);
      return this;
    };

    Container.prototype.close_alert = function(event) {
      event.preventDefault();
      return $(event.currentTarget).parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    Container.prototype.rename_datacenter = function(event) {
      var rename_modal;
      event.preventDefault();
      rename_modal = new UIComponents.RenameItemModal(this.model.get('id'), 'datacenter');
      return rename_modal.render(this.model);
    };

    Container.prototype.delete_datacenter = function(event) {
      var remove_datacenter_dialog;
      event.preventDefault();
      remove_datacenter_dialog = new ServerView.RemoveDatacenterModal;
      return remove_datacenter_dialog.render(this.model);
    };

    Container.prototype.destroy = function() {
      datacenters.off('remove', this.check_if_still_exists);
      this.title.destroy();
      this.profile.destroy();
      this.machine_list.destroy();
      this.performance_graph.destroy();
      return this.logs.destroy();
    };

    return Container;

  })(Backbone.View);
  this.Title = (function(_super) {

    __extends(Title, _super);

    function Title() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.update = __bind(this.update, this);
      return Title.__super__.constructor.apply(this, arguments);
    }

    Title.prototype.className = 'datacenter-info-view';

    Title.prototype.template = Handlebars.templates['datacenter_view_title-template'];

    Title.prototype.initialize = function() {
      this.name = this.model.get('name');
      return this.model.on('change:name', this.update);
    };

    Title.prototype.update = function() {
      if (this.name !== this.model.get('name')) {
        this.name = this.model.get('name');
        return this.render();
      }
    };

    Title.prototype.render = function() {
      this.$el.html(this.template({
        name: this.name
      }));
      return this;
    };

    Title.prototype.destroy = function() {
      return this.model.off('change:name', this.update);
    };

    return Title;

  })(Backbone.View);
  this.Profile = (function(_super) {

    __extends(Profile, _super);

    function Profile() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Profile.__super__.constructor.apply(this, arguments);
    }

    Profile.prototype.className = 'datacenter-info-view';

    Profile.prototype.template = Handlebars.templates['datacenter_view_profile-template'];

    Profile.prototype.initialize = function() {
      this.model.on('all', this.render);
      machines.on('all', this.render);
      directory.on('all', this.render);
      return this.more_link_should_be_displayed = true;
    };

    Profile.prototype.render = function() {
      var json, machine, machine_uuid, machines_in_datacenter, machines_returned, namespace, peer_roles, role, shard, shard_repr, stats, stats_up_to_date, status, total_replicas, total_shards, __shards, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _len5, _m, _n, _namespaces, _o, _ref, _ref1, _ref2, _s, _shards,
        _this = this;
      machines_in_datacenter = machines.filter(function(machine) {
        return machine.get('datacenter_uuid') === _this.model.get('id');
      });
      _namespaces = [];
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        _shards = [];
        _ref1 = namespace.get('blueprint').peers_roles;
        for (machine_uuid in _ref1) {
          peer_roles = _ref1[machine_uuid];
          if (machines.get(machine_uuid).get('datacenter_uuid') === this.model.get('id')) {
            for (shard in peer_roles) {
              role = peer_roles[shard];
              if (role !== 'role_nothing') {
                _shards[_shards.length] = {
                  role: role,
                  shard: shard,
                  name: human_readable_shard(shard)
                };
              }
            }
          }
        }
        if (_shards.length > 0) {
          __shards = {};
          for (_j = 0, _len1 = _shards.length; _j < _len1; _j++) {
            shard = _shards[_j];
            shard_repr = shard.shard.toString();
            if (!(__shards[shard_repr] != null)) {
              __shards[shard_repr] = {
                shard: shard.shard,
                name: human_readable_shard(shard.shard),
                nprimaries: shard.role === 'role_primary' ? 1 : 0,
                nsecondaries: shard.role === 'role_secondary' ? 1 : 0
              };
            } else {
              if (shard.role === 'role_primary') {
                __shards[shard_repr].nprimaries += 1;
              }
              if (shard.role === 'role_secondary') {
                __shards[shard_repr].nsecondaries += 1;
              }
            }
          }
          _namespaces[_namespaces.length] = {
            shards: _.map(__shards, function(shard, shard_repr) {
              return shard;
            }),
            name: namespace.get('name'),
            uuid: namespace.id
          };
        }
      }
      machines_returned = [];
      for (_k = 0, _len2 = machines_in_datacenter.length; _k < _len2; _k++) {
        machine = machines_in_datacenter[_k];
        status = DataUtils.get_machine_reachability(machine.get('id'));
        if (status.reachable) {
          machines_returned.push({
            name: machine.get('name'),
            id: machine.get('id'),
            status: status
          });
        } else {
          machines_returned.unshift({
            name: machine.get('name'),
            id: machine.get('id'),
            status: status
          });
        }
      }
      stats_up_to_date = true;
      for (_l = 0, _len3 = machines_in_datacenter.length; _l < _len3; _l++) {
        machine = machines_in_datacenter[_l];
        if (machine.get('stats_up_to_date') === false) {
          stats_up_to_date = false;
          break;
        }
      }
      total_shards = 0;
      total_replicas = 0;
      for (_m = 0, _len4 = _namespaces.length; _m < _len4; _m++) {
        _n = _namespaces[_m];
        _ref2 = _n.shards;
        for (_o = 0, _len5 = _ref2.length; _o < _len5; _o++) {
          _s = _ref2[_o];
          total_shards += _s.nprimaries;
          total_replicas += _s.nsecondaries + _s.nprimaries;
        }
      }
      json = {
        name: this.model.get('name'),
        list_machines: {
          machines: machines_returned,
          more_link_should_be_displayed: this.more_link_should_be_displayed
        },
        status: DataUtils.get_datacenter_reachability(this.model.get('id')),
        stats_up_to_date: stats_up_to_date,
        nshards: total_shards,
        nreplicas: total_replicas
      };
      stats = this.model.get_stats();
      json = _.extend(json, {
        dc_disk_space: human_readable_units(stats.dc_disk_space, units_space)
      });
      this.$el.html(this.template(json));
      return this;
    };

    Profile.prototype.destroy = function() {
      this.model.off('all', this.render);
      machines.off('all', this.render);
      return directory.off('all', this.render);
    };

    return Profile;

  })(Backbone.View);
  this.MachineList = (function(_super) {

    __extends(MachineList, _super);

    function MachineList() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return MachineList.__super__.constructor.apply(this, arguments);
    }

    MachineList.prototype.template = Handlebars.templates['datacenter_view-machine_list-template'];

    MachineList.prototype.initialize = function() {
      machines.on('change:name', this.render);
      directory.on('all', this.render);
      namespaces.on('change:blueprint', this.render);
      return this.data = {};
    };

    MachineList.prototype.render = function() {
      var data, data_on_machines, machine, machines_in_dc, servers, _i, _len,
        _this = this;
      machines_in_dc = machines.filter(function(machine) {
        return machine.get('datacenter_uuid') === _this.model.get('id');
      });
      data_on_machines = {};
      for (_i = 0, _len = machines_in_dc.length; _i < _len; _i++) {
        machine = machines_in_dc[_i];
        data_on_machines[machine.get('id')] = {
          name: machine.get('name'),
          id: machine.get('id'),
          num_primaries: 0,
          num_secondaries: 0,
          status: DataUtils.get_machine_reachability(machine.get('id'))
        };
      }
      namespaces.each(function(namespace) {
        var machine_id, peer_roles, role, shard, _ref, _results;
        _ref = namespace.get('blueprint').peers_roles;
        _results = [];
        for (machine_id in _ref) {
          peer_roles = _ref[machine_id];
          if (data_on_machines[machine_id] != null) {
            _results.push((function() {
              var _results1;
              _results1 = [];
              for (shard in peer_roles) {
                role = peer_roles[shard];
                machine = data_on_machines[machine_id];
                if (role === 'role_primary') {
                  machine.num_primaries += 1;
                }
                if (role === 'role_secondary') {
                  _results1.push(machine.num_secondaries += 1);
                } else {
                  _results1.push(void 0);
                }
              }
              return _results1;
            })());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      servers = _.sortBy(data_on_machines, function(machine) {
        return machine.name;
      });
      data = {
        has_servers: servers.length > 0,
        servers: servers
      };
      if (!_.isEqual(this.data, data)) {
        this.data = data;
        this.$el.html(this.template(this.data));
      }
      return this;
    };

    MachineList.prototype.destroy = function() {
      machines.off('change:name', this.render);
      directory.off('all', this.render);
      return namespaces.off('change:blueprint', this.render);
    };

    return MachineList;

  })(Backbone.View);
  return this.Data = (function(_super) {

    __extends(Data, _super);

    function Data() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Data.__super__.constructor.apply(this, arguments);
    }

    Data.prototype.initialize = function() {
      return this.namespaces_with_listeners = {};
    };

    Data.prototype.render = function() {
      var json, keys, machine_uuid, machines_in_datacenter, namespace, peer_roles, role, shard, shard_repr, stats, __shards, _i, _j, _len, _len1, _namespaces, _ref, _ref1, _shards,
        _this = this;
      machines_in_datacenter = machines.filter(function(machine) {
        return machine.get('datacenter_uuid') === _this.model.get('id');
      });
      _namespaces = [];
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        _shards = [];
        _ref1 = namespace.get('blueprint').peers_roles;
        for (machine_uuid in _ref1) {
          peer_roles = _ref1[machine_uuid];
          if (machines.get(machine_uuid).get('datacenter_uuid') === this.model.get('id')) {
            for (shard in peer_roles) {
              role = peer_roles[shard];
              if (role !== 'role_nothing') {
                _shards[_shards.length] = {
                  role: role,
                  shard: shard,
                  name: human_readable_shard(shard)
                };
              }
            }
          }
        }
        if (_shards.length > 0) {
          if (!(this.namespaces_with_listeners[namespace.get('id')] != null)) {
            this.namespaces_with_listeners[namespace.get('id')] = true;
            namespace.load_key_distr();
            namespace.on('change:key_distr', this.render);
          }
          __shards = {};
          for (_j = 0, _len1 = _shards.length; _j < _len1; _j++) {
            shard = _shards[_j];
            shard_repr = shard.shard.toString();
            if (!(__shards[shard_repr] != null)) {
              keys = namespace.compute_shard_rows_approximation(shard.shard);
              __shards[shard_repr] = {
                shard: shard.shard,
                name: human_readable_shard(shard.shard),
                nprimaries: shard.role === 'role_primary' ? 1 : 0,
                nsecondaries: shard.role === 'role_secondary' ? 1 : 0,
                keys: (typeof keys === 'string' ? keys : void 0)
              };
            } else {
              if (shard.role === 'role_primary') {
                __shards[shard_repr].nprimaries += 1;
              }
              if (shard.role === 'role_secondary') {
                __shards[shard_repr].nsecondaries += 1;
              }
            }
          }
          _namespaces[_namespaces.length] = {
            shards: _.map(__shards, function(shard, shard_repr) {
              return shard;
            }),
            name: namespace.get('name'),
            uuid: namespace.id
          };
        }
      }
      json = {
        data: {
          namespaces: _namespaces
        }
      };
      stats = this.model.get_stats();
      json = _.extend(json, {
        dc_disk_space: human_readable_units(stats.dc_disk_space, units_space)
      });
      this.$el.html(this.template(json));
      return this;
    };

    Data.prototype.destroy = function() {
      var namespace_id, _results;
      _results = [];
      for (namespace_id in this.namespaces_with_listeners) {
        namespaces.get(namespace_id).off('change:key_distr', this.render);
        _results.push(namespaces.get(namespace_id).clear_timeout());
      }
      return _results;
    };

    return Data;

  })(Backbone.View);
});

module('DashboardView', function() {
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.template = Handlebars.templates['dashboard_view-template'];

    Container.prototype.id = 'dashboard_container';

    Container.prototype.events = {
      'click .view-logs': 'show_all_logs'
    };

    Container.prototype.initialize = function() {
      log_initial('(initializing) dashboard container view');
      this.cluster_status_availability = new DashboardView.ClusterStatusAvailability();
      this.cluster_status_redundancy = new DashboardView.ClusterStatusRedundancy();
      this.cluster_status_reachability = new DashboardView.ClusterStatusReachability();
      this.cluster_status_consistency = new DashboardView.ClusterStatusConsistency();
      this.cluster_performance = new Vis.OpsPlot(computed_cluster.get_stats, {
        width: 833,
        height: 300,
        seconds: 119,
        type: 'cluster'
      });
      return this.logs = new DashboardView.Logs();
    };

    Container.prototype.show_all_logs = function() {
      return window.router.navigate('#logs', {
        trigger: true
      });
    };

    Container.prototype.render = function() {
      this.$el.html(this.template({}));
      this.$('.availability').html(this.cluster_status_availability.render().$el);
      this.$('.redundancy').html(this.cluster_status_redundancy.render().$el);
      this.$('.reachability').html(this.cluster_status_reachability.render().$el);
      this.$('.consistency').html(this.cluster_status_consistency.render().$el);
      this.$('#cluster_performance_container').html(this.cluster_performance.render().$el);
      this.$('.recent-log-entries-container').html(this.logs.render().$el);
      return this;
    };

    Container.prototype.destroy = function() {
      this.cluster_status_availability.destroy();
      this.cluster_status_redundancy.destroy();
      this.cluster_status_reachability.destroy();
      this.cluster_status_consistency.destroy();
      this.cluster_performance.destroy();
      return this.logs.destroy();
    };

    return Container;

  })(Backbone.View);
  this.ClusterStatusAvailability = (function(_super) {

    __extends(ClusterStatusAvailability, _super);

    function ClusterStatusAvailability() {
      this.destroy = __bind(this.destroy, this);

      this.hide_details = __bind(this.hide_details, this);

      this.show_details = __bind(this.show_details, this);

      this.clean_dom_listeners = __bind(this.clean_dom_listeners, this);

      this.render_status = __bind(this.render_status, this);

      this.render = __bind(this.render, this);

      this.compute_data = __bind(this.compute_data, this);

      this.initialize = __bind(this.initialize, this);
      return ClusterStatusAvailability.__super__.constructor.apply(this, arguments);
    }

    ClusterStatusAvailability.prototype.className = 'cluster-status-availability ';

    ClusterStatusAvailability.prototype.template = Handlebars.templates['cluster_status-container-template'];

    ClusterStatusAvailability.prototype.status_template = Handlebars.templates['cluster_status-availability_status-template'];

    ClusterStatusAvailability.prototype.popup_template = Handlebars.templates['cluster_status-availability-popup-template'];

    ClusterStatusAvailability.prototype.events = {
      'click .show_details': 'show_details',
      'click .close': 'hide_details'
    };

    ClusterStatusAvailability.prototype.initialize = function() {
      this.data = '';
      directory.on('all', this.render_status);
      return namespaces.on('all', this.render_status);
    };

    ClusterStatusAvailability.prototype.convert_activity = function(role) {
      switch (role) {
        case 'role_secondary':
          return 'secondary_up_to_date';
        case 'role_nothing':
          return 'nothing';
        case 'role_primary':
          return 'primary';
      }
    };

    ClusterStatusAvailability.prototype.compute_data = function() {
      var blueprint, data, directory_by_namespaces, machine_id, machine_name, namespace, namespace_down, namespace_id, namespaces_down, namespaces_down_array, num_masters, num_masters_down, shard, value, _i, _len, _ref, _ref1;
      num_masters = 0;
      num_masters_down = 0;
      namespaces_down = {};
      directory_by_namespaces = DataUtils.get_directory_activities_by_namespaces();
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        namespace_id = namespace.get('id');
        blueprint = namespace.get('blueprint').peers_roles;
        for (machine_id in blueprint) {
          machine_name = machine_name = (_ref1 = machines.get(machine_id)) != null ? _ref1.get('name') : void 0;
          if (!(machine_name != null)) {
            machine_name = machine_id;
          }
          for (shard in blueprint[machine_id]) {
            value = blueprint[machine_id][shard];
            if (value === "role_primary") {
              num_masters++;
              if (!(directory_by_namespaces != null) || !(directory_by_namespaces[namespace_id] != null) || !(directory_by_namespaces[namespace_id][machine_id] != null)) {
                num_masters_down++;
                if (!(namespaces_down[namespace.get('id')] != null)) {
                  namespaces_down[namespace.get('id')] = [];
                }
                namespaces_down[namespace.get('id')].push({
                  shard: human_readable_shard(shard),
                  namespace_id: namespace.get('id'),
                  namespace_name: namespace.get('name'),
                  machine_id: machine_id,
                  machine_name: machine_name,
                  blueprint_status: value,
                  directory_status: 'Not found'
                });
              } else if (directory_by_namespaces[namespace_id][machine_id][shard] !== this.convert_activity(value)) {
                num_masters_down++;
                if (!(namespaces_down[namespace.get('id')] != null)) {
                  namespaces_down[namespace.get('id')] = [];
                }
                namespaces_down[namespace.get('id')].push({
                  shard: human_readable_shard(shard),
                  namespace_id: namespace.get('id'),
                  namespace_name: namespace.get('name'),
                  machine_id: machine_id,
                  machine_name: machine_name,
                  blueprint_status: value,
                  directory_status: directory_by_namespaces[namespace_id][machine_id][shard]
                });
              }
            }
          }
        }
      }
      if (num_masters_down > 0) {
        namespaces_down_array = [];
        for (namespace_id in namespaces_down) {
          namespace_down = namespaces_down[namespace_id];
          namespaces_down_array.push({
            namespace_id: namespace_id,
            namespace_name: namespaces.get(namespace_id).get('name'),
            namespaces_down: namespace_down
          });
        }
        data = {
          status_is_ok: false,
          num_namespaces_down: namespaces_down_array.length,
          has_namespaces_down: namespaces_down_array.length > 0,
          num_namespaces: namespaces.length,
          num_masters: num_masters,
          num_masters_down: num_masters_down,
          namespaces_down: (namespaces_down_array.length > 0 ? namespaces_down_array : void 0)
        };
      } else {
        data = {
          status_is_ok: true,
          num_masters: num_masters
        };
      }
      return data;
    };

    ClusterStatusAvailability.prototype.render = function() {
      this.$el.html(this.template());
      return this.render_status();
    };

    ClusterStatusAvailability.prototype.render_status = function() {
      var data;
      data = this.compute_data();
      if (_.isEqual(this.data, data) === false) {
        this.data = data;
        this.$('.status').html(this.status_template(data));
        if (data.status_is_ok === true) {
          this.$('.status').addClass('no-problems-detected');
          this.$('.status').removeClass('problems-detected');
        } else {
          this.$('.status').addClass('problems-detected');
          this.$('.status').removeClass('no-problems-detected');
        }
        if (data.status_is_ok === false) {
          this.$('.popup_container').html(this.popup_template(data));
        } else {
          this.$('.popup_container').html(this.popup_template({
            has_namespaces_down: false
          }));
        }
      }
      return this;
    };

    ClusterStatusAvailability.prototype.clean_dom_listeners = function() {
      if (this.link_clicked != null) {
        this.link_clicked.off('mouseup', this.stop_propagation);
      }
      this.$('.popup_container').off('mouseup', this.stop_propagation);
      return $(window).off('mouseup', this.hide_details);
    };

    ClusterStatusAvailability.prototype.show_details = function(event) {
      var margin_left, margin_top;
      event.preventDefault();
      this.clean_dom_listeners();
      this.$('.popup_container').show();
      margin_top = event.pageY - 60 - 13;
      margin_left = event.pageX + 12;
      this.$('.popup_container').css('margin', margin_top + 'px 0px 0px ' + margin_left + 'px');
      this.link_clicked = this.$(event.target);
      this.link_clicked.on('mouseup', this.stop_propagation);
      this.$('.popup_container').on('mouseup', this.stop_propagation);
      return $(window).on('mouseup', this.hide_details);
    };

    ClusterStatusAvailability.prototype.stop_propagation = function(event) {
      return event.stopPropagation();
    };

    ClusterStatusAvailability.prototype.hide_details = function(event) {
      this.$('.popup_container').hide();
      return this.clean_dom_listeners();
    };

    ClusterStatusAvailability.prototype.destroy = function() {
      directory.off('all', this.render_status);
      namespaces.off('all', this.render_status);
      return this.clean_dom_listeners();
    };

    return ClusterStatusAvailability;

  })(Backbone.View);
  this.ClusterStatusRedundancy = (function(_super) {

    __extends(ClusterStatusRedundancy, _super);

    function ClusterStatusRedundancy() {
      this.destroy = __bind(this.destroy, this);

      this.hide_details = __bind(this.hide_details, this);

      this.show_details = __bind(this.show_details, this);

      this.clean_dom_listeners = __bind(this.clean_dom_listeners, this);

      this.render_status = __bind(this.render_status, this);

      this.render = __bind(this.render, this);

      this.compute_data = __bind(this.compute_data, this);

      this.initialize = __bind(this.initialize, this);
      return ClusterStatusRedundancy.__super__.constructor.apply(this, arguments);
    }

    ClusterStatusRedundancy.prototype.className = 'cluster-status-redundancy';

    ClusterStatusRedundancy.prototype.template = Handlebars.templates['cluster_status-container-template'];

    ClusterStatusRedundancy.prototype.status_template = Handlebars.templates['cluster_status-redundancy_status-template'];

    ClusterStatusRedundancy.prototype.popup_template = Handlebars.templates['cluster_status-redundancy-popup-template'];

    ClusterStatusRedundancy.prototype.events = {
      'click .show_details': 'show_details',
      'click .close': 'hide_details'
    };

    ClusterStatusRedundancy.prototype.initialize = function() {
      this.data = '';
      directory.on('all', this.render_status);
      return namespaces.on('all', this.render_status);
    };

    ClusterStatusRedundancy.prototype.convert_activity = function(role) {
      switch (role) {
        case 'role_secondary':
          return 'secondary_up_to_date';
        case 'role_nothing':
          return 'nothing';
        case 'role_primary':
          return 'primary';
      }
    };

    ClusterStatusRedundancy.prototype.compute_data = function() {
      var blueprint, data, datacenter_id, datacenter_name, datacenters_with_issues, directory_by_namespaces, issue, machine_id, machine_name, namespace, namespace_down, namespace_id, namespaces_down, namespaces_down_array, namespaces_with_unsatisfiable_goals, num_replicas, num_replicas_down, num_unsatisfiable_goals, shard, value, _i, _j, _len, _len1, _ref, _ref1, _ref2, _ref3;
      num_replicas = 0;
      num_replicas_down = 0;
      namespaces_down = {};
      directory_by_namespaces = DataUtils.get_directory_activities_by_namespaces();
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        namespace_id = namespace.get('id');
        blueprint = namespace.get('blueprint').peers_roles;
        for (machine_id in blueprint) {
          machine_name = machine_name = (_ref1 = machines.get(machine_id)) != null ? _ref1.get('name') : void 0;
          if (!(machine_name != null)) {
            machine_name = machine_id;
          }
          for (shard in blueprint[machine_id]) {
            value = blueprint[machine_id][shard];
            if (value !== "role_nothing") {
              num_replicas++;
              if (!(directory_by_namespaces != null) || !(directory_by_namespaces[namespace_id] != null) || !(directory_by_namespaces[namespace_id][machine_id] != null)) {
                num_replicas_down++;
                if (!(namespaces_down[namespace.get('id')] != null)) {
                  namespaces_down[namespace.get('id')] = [];
                }
                namespaces_down[namespace.get('id')].push({
                  shard: human_readable_shard(shard),
                  namespace_id: namespace.get('id'),
                  namespace_name: namespace.get('name'),
                  machine_id: machine_id,
                  machine_name: machine_name,
                  blueprint_status: value,
                  directory_status: 'Not found'
                });
              } else if (directory_by_namespaces[namespace_id][machine_id][shard] !== this.convert_activity(value)) {
                num_replicas_down++;
                if (!(namespaces_down[namespace.get('id')] != null)) {
                  namespaces_down[namespace.get('id')] = [];
                }
                namespaces_down[namespace.get('id')].push({
                  shard: human_readable_shard(shard),
                  namespace_id: namespace.get('id'),
                  namespace_name: namespace.get('name'),
                  machine_id: machine_id,
                  machine_name: machine_name,
                  blueprint_status: value,
                  directory_status: directory_by_namespaces[namespace_id][machine_id][shard]
                });
              }
            }
          }
        }
      }
      num_unsatisfiable_goals = 0;
      namespaces_with_unsatisfiable_goals = [];
      _ref2 = issues.models;
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        issue = _ref2[_j];
        if (issue.get('type') === 'UNSATISFIABLE_GOALS') {
          num_unsatisfiable_goals++;
          datacenters_with_issues = [];
          for (datacenter_id in issue.get('replica_affinities')) {
            num_replicas = issue.get('replica_affinities')[datacenter_id];
            if (issue.get('primary_datacenter') === datacenter_id) {
              num_replicas++;
            }
            if (num_replicas > issue.get('actual_machines_in_datacenters')[datacenter_id]) {
              if (datacenter_id === universe_datacenter.get('id')) {
                datacenter_name = universe_datacenter.get('name');
              } else {
                datacenter_name = (_ref3 = datacenters.get(datacenter_id)) != null ? _ref3.get('name') : void 0;
              }
              datacenters_with_issues.push({
                datacenter_id: datacenter_id,
                datacenter_name: datacenter_name,
                num_replicas: num_replicas
              });
            }
          }
          namespaces_with_unsatisfiable_goals.push({
            namespace_id: issue.get('namespace_id'),
            namespace_name: namespaces.get(issue.get('namespace_id')).get('name'),
            datacenters_with_issues: datacenters_with_issues
          });
        }
      }
      if (num_replicas_down > 0) {
        namespaces_down_array = [];
        for (namespace_id in namespaces_down) {
          namespace_down = namespaces_down[namespace_id];
          namespaces_down_array.push({
            namespace_id: namespace_id,
            namespace_name: namespaces.get(namespace_id).get('name'),
            namespaces_down: namespace_down
          });
        }
        data = {
          status_is_ok: false,
          num_namespaces_down: namespaces_down_array.length,
          has_namespaces_down: namespaces_down_array.length > 0,
          num_namespaces: namespaces.length,
          num_replicas: num_replicas,
          num_replicas_down: num_replicas_down,
          namespaces_down: (namespaces_down_array.length > 0 ? namespaces_down_array : void 0),
          has_unsatisfiable_goals: num_unsatisfiable_goals > 0,
          num_unsatisfiable_goals: num_unsatisfiable_goals,
          namespaces_with_unsatisfiable_goals: namespaces_with_unsatisfiable_goals
        };
      } else {
        data = {
          status_is_ok: num_unsatisfiable_goals === 0,
          num_replicas: num_replicas,
          has_unsatisfiable_goals: num_unsatisfiable_goals > 0,
          num_unsatisfiable_goals: num_unsatisfiable_goals,
          namespaces_with_unsatisfiable_goals: namespaces_with_unsatisfiable_goals
        };
      }
      return data;
    };

    ClusterStatusRedundancy.prototype.render = function() {
      this.$el.html(this.template());
      return this.render_status();
    };

    ClusterStatusRedundancy.prototype.render_status = function() {
      var data;
      data = this.compute_data();
      if (_.isEqual(this.data, data) === false) {
        this.data = data;
        this.$('.status').html(this.status_template(data));
        if (data.status_is_ok === true) {
          this.$('.status').addClass('no-problems-detected');
          this.$('.status').removeClass('problems-detected');
        } else {
          this.$('.status').addClass('problems-detected');
          this.$('.status').removeClass('no-problems-detected');
        }
        if (data.status_is_ok === false) {
          this.$('.popup_container').html(this.popup_template(data));
        } else {
          this.$('.popup_container').html(this.popup_template({
            has_namespaces_down: false
          }));
        }
      }
      return this;
    };

    ClusterStatusRedundancy.prototype.clean_dom_listeners = function() {
      if (this.link_clicked != null) {
        this.link_clicked.off('mouseup', this.stop_propagation);
      }
      this.$('.popup_container').off('mouseup', this.stop_propagation);
      return $(window).off('mouseup', this.hide_details);
    };

    ClusterStatusRedundancy.prototype.show_details = function(event) {
      var margin_left, margin_top;
      event.preventDefault();
      this.clean_dom_listeners();
      this.$('.popup_container').show();
      margin_top = event.pageY - 60 - 13;
      margin_left = event.pageX + 12;
      this.$('.popup_container').css('margin', margin_top + 'px 0px 0px ' + margin_left + 'px');
      this.$('.popup_container').on('mouseup', this.stop_propagation);
      this.link_clicked = this.$(event.target);
      this.link_clicked.on('mouseup', this.stop_propagation);
      return $(window).on('mouseup', this.hide_details);
    };

    ClusterStatusRedundancy.prototype.stop_propagation = function(event) {
      return event.stopPropagation();
    };

    ClusterStatusRedundancy.prototype.hide_details = function(event) {
      this.$('.popup_container').hide();
      return this.clean_dom_listeners();
    };

    ClusterStatusRedundancy.prototype.destroy = function() {
      directory.off('all', this.render_status);
      namespaces.off('all', this.render_status);
      return this.clean_dom_listeners();
    };

    return ClusterStatusRedundancy;

  })(Backbone.View);
  this.ClusterStatusReachability = (function(_super) {

    __extends(ClusterStatusReachability, _super);

    function ClusterStatusReachability() {
      this.destroy = __bind(this.destroy, this);

      this.hide_details = __bind(this.hide_details, this);

      this.show_details = __bind(this.show_details, this);

      this.clean_dom_listeners = __bind(this.clean_dom_listeners, this);

      this.render_status = __bind(this.render_status, this);

      this.render = __bind(this.render, this);

      this.compute_data = __bind(this.compute_data, this);

      this.initialize = __bind(this.initialize, this);
      return ClusterStatusReachability.__super__.constructor.apply(this, arguments);
    }

    ClusterStatusReachability.prototype.className = 'cluster-status-redundancy';

    ClusterStatusReachability.prototype.template = Handlebars.templates['cluster_status-container-template'];

    ClusterStatusReachability.prototype.status_template = Handlebars.templates['cluster_status-reachability_status-template'];

    ClusterStatusReachability.prototype.popup_template = Handlebars.templates['cluster_status-reachability-popup-template'];

    ClusterStatusReachability.prototype.events = {
      'click .show_details': 'show_details',
      'click .close': 'hide_details'
    };

    ClusterStatusReachability.prototype.initialize = function() {
      this.data = '';
      directory.on('all', this.render_status);
      return machines.on('all', this.render_status);
    };

    ClusterStatusReachability.prototype.compute_data = function() {
      var data, machine, machine_id, machines_down, machines_down_array, _i, _j, _len, _len1, _ref, _ref1;
      machines_down = {};
      _ref = machines.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        machines_down[machine.get('id')] = true;
      }
      _ref1 = directory.models;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        machine = _ref1[_j];
        if (directory.get(machine.get('id')) != null) {
          machines_down[machine.get('id')] = false;
        }
      }
      machines_down_array = [];
      for (machine_id in machines_down) {
        if (machines_down[machine_id] === false) {
          continue;
        }
        machines_down_array.push({
          machine_id: machine_id,
          machine_name: machines.get(machine_id).get('name')
        });
      }
      data = {
        has_machines_down: machines_down_array.length > 0,
        num_machines_down: machines_down_array.length,
        num_machines: machines.length,
        machines_down: machines_down_array
      };
      return data;
    };

    ClusterStatusReachability.prototype.render = function() {
      this.$el.html(this.template());
      return this.render_status();
    };

    ClusterStatusReachability.prototype.render_status = function() {
      var data;
      data = this.compute_data();
      if (_.isEqual(this.data, data) === false) {
        this.data = data;
        this.$('.status').html(this.status_template(data));
        if (data.has_machines_down === false) {
          this.$('.status').addClass('no-problems-detected');
          this.$('.status').removeClass('problems-detected');
        } else {
          this.$('.status').addClass('problems-detected');
          this.$('.status').removeClass('no-problems-detected');
        }
        this.$('.popup_container').html(this.popup_template(data));
      }
      return this;
    };

    ClusterStatusReachability.prototype.clean_dom_listeners = function() {
      if (this.link_clicked != null) {
        this.link_clicked.off('mouseup', this.stop_propagation);
      }
      this.$('.popup_container').off('mouseup', this.stop_propagation);
      return $(window).off('mouseup', this.hide_details);
    };

    ClusterStatusReachability.prototype.show_details = function(event) {
      var margin_left, margin_top;
      event.preventDefault();
      this.clean_dom_listeners();
      this.$('.popup_container').show();
      margin_top = event.pageY - 60 - 13;
      margin_left = event.pageX - 12 - 470;
      this.$('.popup_container').css('margin', margin_top + 'px 0px 0px ' + margin_left + 'px');
      this.$('.popup_container').on('mouseup', this.stop_propagation);
      this.link_clicked = this.$(event.target);
      this.link_clicked.on('mouseup', this.stop_propagation);
      return $(window).on('mouseup', this.hide_details);
    };

    ClusterStatusReachability.prototype.stop_propagation = function(event) {
      return event.stopPropagation();
    };

    ClusterStatusReachability.prototype.hide_details = function(event) {
      this.$('.popup_container').hide();
      return this.clean_dom_listeners();
    };

    ClusterStatusReachability.prototype.destroy = function() {
      directory.off('all', this.render_status);
      machines.off('all', this.render_status);
      return this.clean_dom_listeners();
    };

    return ClusterStatusReachability;

  })(Backbone.View);
  this.ClusterStatusConsistency = (function(_super) {

    __extends(ClusterStatusConsistency, _super);

    function ClusterStatusConsistency() {
      this.destroy = __bind(this.destroy, this);

      this.hide_details = __bind(this.hide_details, this);

      this.show_details = __bind(this.show_details, this);

      this.clean_dom_listeners = __bind(this.clean_dom_listeners, this);

      this.render_status = __bind(this.render_status, this);

      this.render = __bind(this.render, this);

      this.compute_data = __bind(this.compute_data, this);

      this.initialize = __bind(this.initialize, this);
      return ClusterStatusConsistency.__super__.constructor.apply(this, arguments);
    }

    ClusterStatusConsistency.prototype.className = 'cluster-status-consistency';

    ClusterStatusConsistency.prototype.template = Handlebars.templates['cluster_status-container-template'];

    ClusterStatusConsistency.prototype.status_template = Handlebars.templates['cluster_status-consistency_status-template'];

    ClusterStatusConsistency.prototype.popup_template = Handlebars.templates['cluster_status-consistency-popup-template'];

    ClusterStatusConsistency.prototype.events = {
      'click .show_details': 'show_details',
      'click .close': 'hide_details'
    };

    ClusterStatusConsistency.prototype.initialize = function() {
      this.data = '';
      return issues.on('all', this.render_status);
    };

    ClusterStatusConsistency.prototype.compute_data = function() {
      var conflict, conflicts, issue, name, num_types_conflicts, type, types, _i, _j, _len, _len1, _ref;
      conflicts = [];
      _ref = issues.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        issue = _ref[_i];
        if (issue.get('type') === 'VCLOCK_CONFLICT') {
          type = issue.get('object_type');
          switch (type) {
            case 'namespace':
              type = 'table';
              if (namespaces.get(issue.get('object_id')) != null) {
                name = namespaces.get(issue.get('object_id')).get('name');
              } else {
                name = 'Not found table';
              }
              break;
            case 'database':
              type = 'database';
              if (databases.get(issue.get('object_id'))) {
                name = databases.get(issue.get('object_id')).get('name');
              } else {
                name = 'Not found database';
              }
              break;
            case 'datacenter':
              type = 'datacenter';
              if (issue.get('object_id') === universe_datacenter.get('id')) {
                name = universe_datacenter.get('name');
              } else if (datacenters.get(issue.get('object_id')) != null) {
                name = datacenters.get(issue.get('object_id')).get('name');
              } else {
                name = 'Not found datacenter';
              }
              break;
            case 'machine':
              type = 'server';
              if (machines.get(issue.get('object_id'))) {
                name = machines.get(issue.get('object_id')).get('name');
              } else {
                name = 'Not found server';
              }
          }
          conflicts.push({
            id: issue.get('object_id'),
            type: type,
            name: name,
            field: issue.get('field')
          });
        }
      }
      types = {};
      num_types_conflicts = 0;
      for (_j = 0, _len1 = conflicts.length; _j < _len1; _j++) {
        conflict = conflicts[_j];
        if (!(types[conflict.type] != null)) {
          types[conflict.type] = 1;
          num_types_conflicts++;
        } else {
          types[conflict.type]++;
        }
      }
      return {
        has_conflicts: conflicts.length > 0,
        conflicts: conflicts,
        has_multiple_types: num_types_conflicts > 1,
        num_types_conflicts: num_types_conflicts,
        types: (num_types_conflicts === 1 ? type : void 0),
        type: (type != null ? type : void 0),
        num_conflicts: conflicts.length,
        num_namespaces_conflicting: conflicts.length,
        num_namespaces: namespaces.length
      };
    };

    ClusterStatusConsistency.prototype.render = function() {
      this.$el.html(this.template());
      return this.render_status();
    };

    ClusterStatusConsistency.prototype.render_status = function() {
      var data;
      data = this.compute_data();
      if (_.isEqual(this.data, data) === false) {
        this.$('.status').html(this.status_template(data));
        if (data.has_conflicts === false) {
          this.$('.status').addClass('no-problems-detected');
          this.$('.status').removeClass('problems-detected');
        } else {
          this.$('.status').addClass('problems-detected');
          this.$('.status').removeClass('no-problems-detected');
        }
        this.$('.popup_container').html(this.popup_template(data));
      }
      return this;
    };

    ClusterStatusConsistency.prototype.clean_dom_listeners = function() {
      if (this.link_clicked != null) {
        this.link_clicked.off('mouseup', this.stop_propagation);
      }
      this.$('.popup_container').off('mouseup', this.stop_propagation);
      return $(window).off('mouseup', this.hide_details);
    };

    ClusterStatusConsistency.prototype.show_details = function(event) {
      var margin_left, margin_top;
      event.preventDefault();
      this.clean_dom_listeners();
      this.$('.popup_container').show();
      margin_top = event.pageY - 60 - 13;
      margin_left = event.pageX - 12 - 470;
      this.$('.popup_container').css('margin', margin_top + 'px 0px 0px ' + margin_left + 'px');
      this.$('.popup_container').on('mouseup', this.stop_propagation);
      this.link_clicked = this.$(event.target);
      this.link_clicked.on('mouseup', this.stop_propagation);
      return $(window).on('mouseup', this.hide_details);
    };

    ClusterStatusConsistency.prototype.stop_propagation = function(event) {
      return event.stopPropagation();
    };

    ClusterStatusConsistency.prototype.hide_details = function(event) {
      this.$('.popup_container').hide();
      return this.clean_dom_listeners();
    };

    ClusterStatusConsistency.prototype.destroy = function() {
      issues.off('all', this.render_status);
      return this.clean_dom_listeners();
    };

    return ClusterStatusConsistency;

  })(Backbone.View);
  return this.Logs = (function(_super) {

    __extends(Logs, _super);

    function Logs() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.set_log_entries = __bind(this.set_log_entries, this);

      this.fetch_log = __bind(this.fetch_log, this);
      return Logs.__super__.constructor.apply(this, arguments);
    }

    Logs.prototype.className = 'log-entries';

    Logs.prototype.tagName = 'ul';

    Logs.prototype.min_timestamp = 0;

    Logs.prototype.max_entry_logs = 5;

    Logs.prototype.interval_update_log = 10000;

    Logs.prototype.compact_entries = true;

    Logs.prototype.initialize = function() {
      this.fetch_log();
      this.interval = setInterval(this.fetch_log, this.interval_update_log);
      return this.log_entries = [];
    };

    Logs.prototype.fetch_log = function() {
      return $.ajax({
        contentType: 'application/json',
        url: 'ajax/log/_?max_length=' + this.max_entry_logs + '&min_timestamp=' + this.min_timestamp,
        dataType: 'json',
        success: this.set_log_entries
      });
    };

    Logs.prototype.set_log_entries = function(response) {
      var data, entry, i, machine_id, need_render, new_log_entry, old_log_entry, _i, _j, _len, _len1, _ref;
      need_render = false;
      for (machine_id in response) {
        data = response[machine_id];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          new_log_entry = data[_i];
          _ref = this.log_entries;
          for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
            old_log_entry = _ref[i];
            if (parseFloat(new_log_entry.timestamp) > parseFloat(old_log_entry.get('timestamp'))) {
              entry = new LogEntry(new_log_entry);
              entry.set('machine_uuid', machine_id);
              this.log_entries.splice(i, 0, entry);
              need_render = true;
              break;
            }
          }
          if (this.log_entries.length < this.max_entry_logs) {
            entry = new LogEntry(new_log_entry);
            entry.set('machine_uuid', machine_id);
            this.log_entries.push(entry);
            need_render = true;
          } else if (this.log_entries.length > this.max_entry_logs) {
            this.log_entries.pop();
          }
        }
      }
      if (need_render) {
        this.render();
      }
      if ((this.log_entries[0] != null) && _.isNaN(parseFloat(this.log_entries[0].get('timestamp'))) === false) {
        return this.min_timestamp = parseFloat(this.log_entries[0].get('timestamp')) + 1;
      }
    };

    Logs.prototype.render = function() {
      var log, view, _i, _len, _ref;
      this.$el.html('');
      _ref = this.log_entries;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        log = _ref[_i];
        view = new LogView.LogEntry({
          model: log
        });
        this.$el.append(view.render(this.compact_entries).$el);
      }
      return this;
    };

    Logs.prototype.destroy = function() {
      return clearInterval(this.interval);
    };

    return Logs;

  })(Backbone.View);
});

module('DataExplorerView', function() {
  this.state = {
    current_query: null,
    query: null,
    results: null,
    profile: null,
    cursor: null,
    metadata: null,
    cursor_timed_out: true,
    view: 'tree',
    history_state: 'hidden',
    last_keys: [],
    last_columns_size: {},
    options_state: 'hidden',
    options: {
      suggestions: true,
      electric_punctuation: false,
      profiler: false
    },
    history: [],
    focus_on_codemirror: true,
    last_query_has_profile: true
  };
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.display_full = __bind(this.display_full, this);

      this.display_normal = __bind(this.display_normal, this);

      this.toggle_size = __bind(this.toggle_size, this);

      this.handle_gutter_click = __bind(this.handle_gutter_click, this);

      this.reconnect = __bind(this.reconnect, this);

      this.error_on_connect = __bind(this.error_on_connect, this);

      this.success_on_connect = __bind(this.success_on_connect, this);

      this.clear_query = __bind(this.clear_query, this);

      this.separate_queries = __bind(this.separate_queries, this);

      this.evaluate = __bind(this.evaluate, this);

      this.generate_get_result_callback = __bind(this.generate_get_result_callback, this);

      this.generate_rdb_global_callback = __bind(this.generate_rdb_global_callback, this);

      this.execute_portion = __bind(this.execute_portion, this);

      this.execute_query = __bind(this.execute_query, this);

      this.show_more_results = __bind(this.show_more_results, this);

      this.extract_database_used = __bind(this.extract_database_used, this);

      this.extend_description = __bind(this.extend_description, this);

      this.mouseout_suggestion = __bind(this.mouseout_suggestion, this);

      this.mouseover_suggestion = __bind(this.mouseover_suggestion, this);

      this.select_suggestion = __bind(this.select_suggestion, this);

      this.write_suggestion = __bind(this.write_suggestion, this);

      this.remove_highlight_suggestion = __bind(this.remove_highlight_suggestion, this);

      this.highlight_suggestion = __bind(this.highlight_suggestion, this);

      this.move_suggestion = __bind(this.move_suggestion, this);

      this.show_or_hide_arrow = __bind(this.show_or_hide_arrow, this);

      this.hide_suggestion_and_description = __bind(this.hide_suggestion_and_description, this);

      this.hide_description = __bind(this.hide_description, this);

      this.hide_suggestion = __bind(this.hide_suggestion, this);

      this.show_description = __bind(this.show_description, this);

      this.show_suggestion_without_moving = __bind(this.show_suggestion_without_moving, this);

      this.show_suggestion = __bind(this.show_suggestion, this);

      this.create_safe_regex = __bind(this.create_safe_regex, this);

      this.create_suggestion = __bind(this.create_suggestion, this);

      this.extract_data_from_query = __bind(this.extract_data_from_query, this);

      this.get_last_key = __bind(this.get_last_key, this);

      this.last_element_type_if_incomplete = __bind(this.last_element_type_if_incomplete, this);

      this.handle_keypress = __bind(this.handle_keypress, this);

      this.count_not_closed_brackets = __bind(this.count_not_closed_brackets, this);

      this.count_char = __bind(this.count_char, this);

      this.move_cursor = __bind(this.move_cursor, this);

      this.remove_next = __bind(this.remove_next, this);

      this.insert_next = __bind(this.insert_next, this);

      this.get_previous_char = __bind(this.get_previous_char, this);

      this.get_next_char = __bind(this.get_next_char, this);

      this.pair_char = __bind(this.pair_char, this);

      this.handle_click = __bind(this.handle_click, this);

      this.on_blur = __bind(this.on_blur, this);

      this.init_after_dom_rendered = __bind(this.init_after_dom_rendered, this);

      this.render = __bind(this.render, this);

      this.handle_mouseup = __bind(this.handle_mouseup, this);

      this.handle_mousemove = __bind(this.handle_mousemove, this);

      this.initialize = __bind(this.initialize, this);

      this.clear_history = __bind(this.clear_history, this);

      this.save_query = __bind(this.save_query, this);

      this.set_docs = __bind(this.set_docs, this);

      this.set_doc_description = __bind(this.set_doc_description, this);

      this.expand_types = __bind(this.expand_types, this);

      this.convert_type = __bind(this.convert_type, this);

      this.activate_overflow = __bind(this.activate_overflow, this);

      this.deactivate_overflow = __bind(this.deactivate_overflow, this);

      this.adjust_collapsible_panel_height = __bind(this.adjust_collapsible_panel_height, this);

      this.move_arrow = __bind(this.move_arrow, this);

      this.hide_collapsible_panel = __bind(this.hide_collapsible_panel, this);

      this.toggle_options = __bind(this.toggle_options, this);

      this.toggle_history = __bind(this.toggle_history, this);

      this.toggle_pressed_buttons = __bind(this.toggle_pressed_buttons, this);

      this.clear_history_view = __bind(this.clear_history_view, this);

      this.start_resize_history = __bind(this.start_resize_history, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.id = 'dataexplorer';

    Container.prototype.template = Handlebars.templates['dataexplorer_view-template'];

    Container.prototype.input_query_template = Handlebars.templates['dataexplorer_input_query-template'];

    Container.prototype.description_template = Handlebars.templates['dataexplorer-description-template'];

    Container.prototype.template_suggestion_name = Handlebars.templates['dataexplorer_suggestion_name_li-template'];

    Container.prototype.description_with_example_template = Handlebars.templates['dataexplorer-description_with_example-template'];

    Container.prototype.alert_connection_fail_template = Handlebars.templates['alert-connection_fail-template'];

    Container.prototype.alert_reconnection_success_template = Handlebars.templates['alert-reconnection_success-template'];

    Container.prototype.databases_suggestions_template = Handlebars.templates['dataexplorer-databases_suggestions-template'];

    Container.prototype.namespaces_suggestions_template = Handlebars.templates['dataexplorer-namespaces_suggestions-template'];

    Container.prototype.reason_dataexplorer_broken_template = Handlebars.templates['dataexplorer-reason_broken-template'];

    Container.prototype.query_error_template = Handlebars.templates['dataexplorer-query_error-template'];

    Container.prototype.limit = 40;

    Container.prototype.line_height = 13;

    Container.prototype.size_history = 50;

    Container.prototype.max_size_stack = 100;

    Container.prototype.max_size_query = 1000;

    Container.prototype.events = {
      'mouseup .CodeMirror': 'handle_click',
      'mousedown .suggestion_name_li': 'select_suggestion',
      'mouseover .suggestion_name_li': 'mouseover_suggestion',
      'mouseout .suggestion_name_li': 'mouseout_suggestion',
      'click .clear_query': 'clear_query',
      'click .execute_query': 'execute_query',
      'click .change_size': 'toggle_size',
      'click #reconnect': 'reconnect',
      'click .more_results': 'show_more_results',
      'click .close': 'close_alert',
      'click .clear_queries_link': 'clear_history_view',
      'click .close_queries_link': 'toggle_history',
      'click .toggle_options_link': 'toggle_options',
      'mousedown .nano_border_bottom': 'start_resize_history'
    };

    Container.prototype.start_resize_history = function(event) {
      return this.history_view.start_resize(event);
    };

    Container.prototype.clear_history_view = function(event) {
      var that;
      that = this;
      this.clear_history();
      this.history_view.history = this.history;
      return this.history_view.clear_history(event);
    };

    Container.prototype.toggle_pressed_buttons = function() {
      if (this.history_view.state === 'visible') {
        this.state.history_state = 'visible';
        this.$('.clear_queries_link').fadeIn('fast');
        this.$('.close_queries_link').addClass('active');
      } else {
        this.state.history_state = 'hidden';
        this.$('.clear_queries_link').fadeOut('fast');
        this.$('.close_queries_link').removeClass('active');
      }
      if (this.options_view.state === 'visible') {
        this.state.options_state = 'visible';
        return this.$('.toggle_options_link').addClass('active');
      } else {
        this.state.options_state = 'hidden';
        return this.$('.toggle_options_link').removeClass('active');
      }
    };

    Container.prototype.toggle_history = function(args) {
      var that;
      that = this;
      this.deactivate_overflow();
      if (args.no_animation === true) {
        this.history_view.state = 'visible';
        this.$('.content').html(this.history_view.render(true).$el);
        this.move_arrow({
          type: 'history',
          move_arrow: 'show'
        });
        this.adjust_collapsible_panel_height({
          no_animation: true,
          is_at_bottom: true
        });
      } else if (this.options_view.state === 'visible') {
        this.options_view.state = 'hidden';
        this.move_arrow({
          type: 'history',
          move_arrow: 'animate'
        });
        this.options_view.$el.fadeOut('fast', function() {
          that.$('.content').html(that.history_view.render(false).$el);
          that.history_view.state = 'visible';
          that.history_view.$el.fadeIn('fast');
          that.adjust_collapsible_panel_height({
            is_at_bottom: true
          });
          return that.toggle_pressed_buttons();
        });
      } else if (this.history_view.state === 'hidden') {
        this.history_view.state = 'visible';
        this.$('.content').html(this.history_view.render(true).$el);
        this.history_view.delegateEvents();
        this.move_arrow({
          type: 'history',
          move_arrow: 'show'
        });
        this.adjust_collapsible_panel_height({
          is_at_bottom: true
        });
      } else if (this.history_view.state === 'visible') {
        this.history_view.state = 'hidden';
        this.hide_collapsible_panel('history');
      }
      return this.toggle_pressed_buttons();
    };

    Container.prototype.toggle_options = function(args) {
      var that;
      that = this;
      this.deactivate_overflow();
      if ((args != null ? args.no_animation : void 0) === true) {
        this.options_view.state = 'visible';
        this.$('.content').html(this.options_view.render(true).$el);
        this.options_view.delegateEvents();
        this.move_arrow({
          type: 'options',
          move_arrow: 'show'
        });
        this.adjust_collapsible_panel_height({
          no_animation: true,
          is_at_bottom: true
        });
      } else if (this.history_view.state === 'visible') {
        this.history_view.state = 'hidden';
        this.move_arrow({
          type: 'options',
          move_arrow: 'animate'
        });
        this.history_view.$el.fadeOut('fast', function() {
          that.$('.content').html(that.options_view.render(false).$el);
          that.options_view.state = 'visible';
          that.options_view.$el.fadeIn('fast');
          that.adjust_collapsible_panel_height();
          that.toggle_pressed_buttons();
          that.$('.profiler_enabled').css('visibility', 'hidden');
          return that.$('.profiler_enabled').hide();
        });
      } else if (this.options_view.state === 'hidden') {
        this.options_view.state = 'visible';
        this.$('.content').html(this.options_view.render(true).$el);
        this.options_view.delegateEvents();
        this.move_arrow({
          type: 'options',
          move_arrow: 'show'
        });
        this.adjust_collapsible_panel_height({
          cb: args != null ? args.cb : void 0
        });
      } else if (this.options_view.state === 'visible') {
        this.options_view.state = 'hidden';
        this.hide_collapsible_panel('options');
      }
      return this.toggle_pressed_buttons();
    };

    Container.prototype.hide_collapsible_panel = function(type) {
      var that;
      that = this;
      this.deactivate_overflow();
      this.$('.nano').animate({
        height: 0
      }, 200, function() {
        that.activate_overflow();
        if ((type === 'history' && that.history_view.state === 'hidden') || (type === 'options' && that.options_view.state === 'hidden')) {
          that.$('.nano_border').hide();
          that.$('.arrow_dataexplorer').hide();
          return that.$(this).css('visibility', 'hidden');
        }
      });
      this.$('.nano_border').slideUp('fast');
      return this.$('.arrow_dataexplorer').slideUp('fast');
    };

    Container.prototype.move_arrow = function(args) {
      var margin_right;
      if (args.type === 'options') {
        margin_right = 74;
      } else if (args.type === 'history') {
        margin_right = 154;
      }
      if (args.move_arrow === 'show') {
        this.$('.arrow_dataexplorer').css('margin-right', margin_right);
        this.$('.arrow_dataexplorer').show();
      } else if (args.move_arrow === 'animate') {
        this.$('.arrow_dataexplorer').animate({
          'margin-right': margin_right
        }, 200);
      }
      return this.$('.nano_border').show();
    };

    Container.prototype.adjust_collapsible_panel_height = function(args) {
      var duration, size, that;
      that = this;
      if ((args != null ? args.size : void 0) != null) {
        size = args.size;
      } else {
        if ((args != null ? args.extra : void 0) != null) {
          size = Math.min(this.$('.content > div').height() + args.extra, this.history_view.height_history);
        } else {
          size = Math.min(this.$('.content > div').height(), this.history_view.height_history);
        }
      }
      this.deactivate_overflow();
      duration = Math.max(150, size);
      duration = Math.min(duration, 250);
      this.$('.nano').css('visibility', 'visible');
      if ((args != null ? args.no_animation : void 0) === true) {
        this.$('.nano').height(size);
        this.$('.nano > .content').scrollTop(this.$('.nano > .content > div').height());
        this.$('.nano').css('visibility', 'visible');
        this.$('.arrow_dataexplorer').show();
        this.$('.nano_border').show();
        if ((args != null ? args.no_animation : void 0) === true) {
          this.$('.nano').nanoScroller({
            preventPageScrolling: true
          });
        }
        return this.activate_overflow();
      } else {
        this.$('.nano').animate({
          height: size
        }, duration, function() {
          that.$(this).css('visibility', 'visible');
          that.$('.arrow_dataexplorer').show();
          that.$('.nano_border').show();
          that.$(this).nanoScroller({
            preventPageScrolling: true
          });
          that.activate_overflow();
          if ((args != null) && args.delay_scroll === true && args.is_at_bottom === true) {
            that.$('.nano > .content').animate({
              scrollTop: that.$('.nano > .content > div').height()
            }, 200);
          }
          if (args.cb != null) {
            return args.cb();
          }
        });
        if ((args != null) && args.delay_scroll !== true && args.is_at_bottom === true) {
          return that.$('.nano > .content').animate({
            scrollTop: that.$('.nano > .content > div').height()
          }, 200);
        }
      }
    };

    Container.prototype.deactivate_overflow = function() {
      if ($(window).height() >= $(document).height()) {
        return $('body').css('overflow', 'hidden');
      }
    };

    Container.prototype.activate_overflow = function() {
      return $('body').css('overflow', 'auto');
    };

    Container.prototype.displaying_full_view = false;

    Container.prototype.close_alert = function(event) {
      event.preventDefault();
      return $(event.currentTarget).parent().slideUp('fast', function() {
        return $(this).remove();
      });
    };

    Container.prototype.map_state = {
      '': ''
    };

    Container.prototype.descriptions = {};

    Container.prototype.suggestions = {};

    Container.prototype.types = {
      value: ['number', 'bool', 'string', 'array', 'object', 'time'],
      any: ['number', 'bool', 'string', 'array', 'object', 'stream', 'selection', 'table', 'db', 'r', 'error'],
      sequence: ['table', 'selection', 'stream', 'array']
    };

    Container.prototype.convert_type = function(type) {
      if (this.types[type] != null) {
        return this.types[type];
      } else {
        return [type];
      }
    };

    Container.prototype.expand_types = function(ar) {
      var element, result, _i, _len;
      result = [];
      if (_.isArray(ar)) {
        for (_i = 0, _len = ar.length; _i < _len; _i++) {
          element = ar[_i];
          result.concat(this.convert_type(element));
        }
      } else {
        result.concat(this.convert_type(element));
      }
      return result;
    };

    Container.prototype.set_doc_description = function(command, tag, suggestions) {
      var dont_need_parenthesis, full_tag, pair, parent_value, parent_values, parents, return_values, returns, _i, _j, _len, _len1, _ref, _ref1;
      if (command['body'] != null) {
        dont_need_parenthesis = !(new RegExp(tag + '\\(')).test(command['body']);
        if (dont_need_parenthesis) {
          full_tag = tag;
        } else {
          full_tag = tag + '(';
        }
        this.descriptions[full_tag] = {
          name: tag,
          args: (_ref = /.*(\(.*\))/.exec(command['body'])) != null ? _ref[1] : void 0,
          description: this.description_with_example_template({
            description: command['description'],
            example: command['example']
          })
        };
      }
      parents = {};
      returns = [];
      _ref1 = command.io;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        pair = _ref1[_i];
        parent_values = pair[0] === null ? '' : pair[0];
        return_values = pair[1];
        parent_values = this.convert_type(parent_values);
        return_values = this.convert_type(return_values);
        returns = returns.concat(return_values);
        for (_j = 0, _len1 = parent_values.length; _j < _len1; _j++) {
          parent_value = parent_values[_j];
          parents[parent_value] = true;
        }
      }
      if (full_tag !== '(') {
        for (parent_value in parents) {
          if (!(suggestions[parent_value] != null)) {
            suggestions[parent_value] = [];
          }
          suggestions[parent_value].push(full_tag);
        }
      }
      return this.map_state[full_tag] = returns;
    };

    Container.prototype.ignored_commands = {
      'connect': true,
      'close': true,
      'reconnect': true,
      'use': true,
      'runp': true,
      'next': true,
      'collect': true,
      'run': true
    };

    Container.prototype.set_docs = function(data) {
      var command, key, relations, state, tag;
      for (key in data) {
        command = data[key];
        tag = command['name'];
        if (tag in this.ignored_commands) {
          continue;
        }
        if (tag === '()') {
          tag = '';
        }
        this.set_doc_description(command, tag, this.suggestions);
      }
      relations = data['types'];
      for (state in this.suggestions) {
        this.suggestions[state].sort();
      }
      if (DataExplorerView.Container.prototype.focus_on_codemirror === true) {
        return window.router.current_view.handle_keypress();
      }
    };

    Container.prototype.save_query = function(args) {
      var broken_query, query;
      query = args.query;
      broken_query = args.broken_query;
      query = query.replace(/^\s*$[\n\r]{1,}/gm, '');
      query = query.replace(/\s*$/, '');
      if (window.localStorage != null) {
        if (this.state.history.length === 0 || this.state.history[this.state.history.length - 1].query !== query && this.regex.white.test(query) === false) {
          this.state.history.push({
            query: query,
            broken_query: broken_query
          });
          if (this.state.history.length > this.size_history) {
            window.localStorage.rethinkdb_history = JSON.stringify(this.state.history.slice(this.state.history.length - this.size_history));
          } else {
            window.localStorage.rethinkdb_history = JSON.stringify(this.state.history);
          }
          return this.history_view.add_query({
            query: query,
            broken_query: broken_query
          });
        }
      }
    };

    Container.prototype.clear_history = function() {
      this.state.history.length = 0;
      return window.localStorage.rethinkdb_history = JSON.stringify(this.state.history);
    };

    Container.prototype.initialize = function(args) {
      var _ref, _ref1;
      this.TermBaseConstructor = r.expr(1).constructor.__super__.constructor.__super__.constructor;
      this.state = args.state;
      if (((_ref = window.localStorage) != null ? _ref.options : void 0) != null) {
        this.state.options = JSON.parse(window.localStorage.options);
      }
      if (((_ref1 = window.localStorage) != null ? _ref1.rethinkdb_history : void 0) != null) {
        this.state.history = JSON.parse(window.localStorage.rethinkdb_history);
      }
      this.show_query_warning = this.state.query !== this.state.current_query;
      this.current_results = this.state.results;
      this.profile = this.state.profile;
      this.history_displayed_id = 0;
      this.unsafe_to_safe_regexstr = [[/\\/g, '\\\\'], [/\(/g, '\\('], [/\)/g, '\\)'], [/\^/g, '\\^'], [/\$/g, '\\$'], [/\*/g, '\\*'], [/\+/g, '\\+'], [/\?/g, '\\?'], [/\./g, '\\.'], [/\|/g, '\\|'], [/\{/g, '\\{'], [/\}/g, '\\}'], [/\[/g, '\\[']];
      this.results_view = new DataExplorerView.ResultView({
        container: this,
        limit: this.limit,
        view: this.state.view
      });
      this.options_view = new DataExplorerView.OptionsView({
        container: this,
        options: this.state.options
      });
      this.history_view = new DataExplorerView.HistoryView({
        container: this,
        history: this.state.history
      });
      this.driver_handler = new DataExplorerView.DriverHandler({
        container: this,
        on_success: this.success_on_connect,
        on_fail: this.error_on_connect
      });
      $(window).mousemove(this.handle_mousemove);
      $(window).mouseup(this.handle_mouseup);
      this.id_execution = 0;
      return this.render();
    };

    Container.prototype.handle_mousemove = function(event) {
      this.results_view.handle_mousemove(event);
      return this.history_view.handle_mousemove(event);
    };

    Container.prototype.handle_mouseup = function(event) {
      this.results_view.handle_mouseup(event);
      return this.history_view.handle_mouseup(event);
    };

    Container.prototype.render = function() {
      var _ref, _ref1, _ref2;
      this.$el.html(this.template());
      this.$('.input_query_full_container').html(this.input_query_template());
      if ((typeof navigator !== "undefined" && navigator !== null ? navigator.appName : void 0) === 'Microsoft Internet Explorer') {
        this.$('.reason_dataexplorer_broken').html(this.reason_dataexplorer_broken_template({
          is_internet_explorer: true
        }));
        this.$('.reason_dataexplorer_broken').slideDown('fast');
        this.$('.button_query').prop('disabled', 'disabled');
      } else if ((!(typeof DataView !== "undefined" && DataView !== null)) || (!(typeof Uint8Array !== "undefined" && Uint8Array !== null))) {
        this.$('.reason_dataexplorer_broken').html(this.reason_dataexplorer_broken_template);
        this.$('.reason_dataexplorer_broken').slideDown('fast');
        this.$('.button_query').prop('disabled', 'disabled');
      } else if (!(window.r != null)) {
        this.$('.reason_dataexplorer_broken').html(this.reason_dataexplorer_broken_template({
          no_driver: true
        }));
        this.$('.reason_dataexplorer_broken').slideDown('fast');
        this.$('.button_query').prop('disabled', 'disabled');
      }
      if ((((_ref = this.state) != null ? _ref.query : void 0) != null) && (((_ref1 = this.state) != null ? _ref1.results : void 0) != null) && (((_ref2 = this.state) != null ? _ref2.metadata : void 0) != null)) {
        this.$('.results_container').html(this.results_view.render_result({
          show_query_warning: this.show_query_warning,
          results: this.state.results,
          metadata: this.state.metadata,
          profile: this.state.profile
        }).$el);
      } else {
        this.$('.results_container').html(this.results_view.render_default().$el);
      }
      if (this.driver_connected === false) {
        this.error_on_connect();
      }
      return this;
    };

    Container.prototype.init_after_dom_rendered = function() {
      this.codemirror = CodeMirror.fromTextArea(document.getElementById('input_query'), {
        mode: {
          name: 'javascript'
        },
        onKeyEvent: this.handle_keypress,
        lineNumbers: true,
        lineWrapping: true,
        matchBrackets: true,
        tabSize: 2
      });
      this.codemirror.on('blur', this.on_blur);
      this.codemirror.on('gutterClick', this.handle_gutter_click);
      this.codemirror.setSize('100%', 'auto');
      if (this.state.current_query != null) {
        this.codemirror.setValue(this.state.current_query);
      }
      this.codemirror.focus();
      this.state.focus_on_codemirror = true;
      this.codemirror.setCursor(this.codemirror.lineCount(), 0);
      if (this.codemirror.getValue() === '') {
        this.handle_keypress();
      }
      this.results_view.expand_raw_textarea();
      this.draft = this.codemirror.getValue();
      if (this.state.history_state === 'visible') {
        this.toggle_history({
          no_animation: true
        });
      }
      if (this.state.options_state === 'visible') {
        return this.toggle_options({
          no_animation: true
        });
      }
    };

    Container.prototype.on_blur = function() {
      this.state.focus_on_codemirror = false;
      return this.hide_suggestion_and_description();
    };

    Container.prototype.current_suggestions = [];

    Container.prototype.current_highlighted_suggestion = -1;

    Container.prototype.current_conpleted_query = '';

    Container.prototype.query_first_part = '';

    Container.prototype.query_last_part = '';

    Container.prototype.mouse_type_event = {
      click: true,
      dblclick: true,
      mousedown: true,
      mouseup: true,
      mouseover: true,
      mouseout: true,
      mousemove: true
    };

    Container.prototype.char_breakers = {
      '.': true,
      '}': true,
      ')': true,
      ',': true,
      ';': true,
      ']': true
    };

    Container.prototype.handle_click = function(event) {
      return this.handle_keypress(null, event);
    };

    Container.prototype.pair_char = function(event, stack) {
      var char_to_insert, last_element_incomplete_type, last_key, next_char, num_not_closed_bracket, num_quote, opening_char, previous_char;
      if ((event != null ? event.which : void 0) != null) {
        if (this.codemirror.getSelection() !== '' && event.type === 'keypress') {
          char_to_insert = String.fromCharCode(event.which);
          if ((char_to_insert != null) && char_to_insert === '"' || char_to_insert === "'") {
            this.codemirror.replaceSelection(char_to_insert + this.codemirror.getSelection() + char_to_insert);
            event.preventDefault();
            return true;
          }
        }
        if (event.which === 8) {
          if (event.type !== 'keydown') {
            return true;
          }
          previous_char = this.get_previous_char();
          if (previous_char === null) {
            return true;
          }
          if (previous_char in this.matching_opening_bracket) {
            next_char = this.get_next_char();
            if (next_char === this.matching_opening_bracket[previous_char]) {
              num_not_closed_bracket = this.count_not_closed_brackets(previous_char);
              if (num_not_closed_bracket <= 0) {
                this.remove_next();
                return true;
              }
            }
          } else if (previous_char === '"' || previous_char === "'") {
            next_char = this.get_next_char();
            if (next_char === previous_char && this.get_previous_char(2) !== '\\') {
              num_quote = this.count_char(char_to_insert);
              if (num_quote % 2 === 0) {
                this.remove_next();
                return true;
              }
            }
          }
          return true;
        }
        if (event.type !== 'keypress') {
          return true;
        }
        char_to_insert = String.fromCharCode(event.which);
        if (char_to_insert != null) {
          if (this.codemirror.getSelection() !== '') {
            if (char_to_insert in this.matching_opening_bracket || char_to_insert in this.matching_closing_bracket) {
              this.codemirror.replaceSelection('');
            } else {
              return true;
            }
          }
          last_element_incomplete_type = this.last_element_type_if_incomplete(stack);
          if (char_to_insert === '"' || char_to_insert === "'") {
            num_quote = this.count_char(char_to_insert);
            next_char = this.get_next_char();
            if (next_char === char_to_insert) {
              if (num_quote % 2 === 0) {
                if (last_element_incomplete_type === 'string' || last_element_incomplete_type === 'object_key') {
                  this.move_cursor(1);
                  event.preventDefault();
                  return true;
                } else {
                  return true;
                }
              } else {
                return true;
              }
            } else {
              if (num_quote % 2 === 0) {
                last_key = this.get_last_key(stack);
                if (last_element_incomplete_type === 'string') {
                  return true;
                } else if (last_element_incomplete_type === 'object_key' && (last_key !== '' && this.create_safe_regex(char_to_insert).test(last_key) === true)) {
                  return true;
                } else {
                  this.insert_next(char_to_insert);
                }
              } else {
                return true;
              }
            }
          } else if (last_element_incomplete_type !== 'string') {
            next_char = this.get_next_char();
            if (char_to_insert in this.matching_opening_bracket) {
              num_not_closed_bracket = this.count_not_closed_brackets(char_to_insert);
              if (num_not_closed_bracket >= 0) {
                this.insert_next(this.matching_opening_bracket[char_to_insert]);
                return true;
              }
              return true;
            } else if (char_to_insert in this.matching_closing_bracket) {
              opening_char = this.matching_closing_bracket[char_to_insert];
              num_not_closed_bracket = this.count_not_closed_brackets(opening_char);
              if (next_char === char_to_insert) {
                if (num_not_closed_bracket <= 0) {
                  this.move_cursor(1);
                  event.preventDefault();
                }
                return true;
              }
            }
          }
        }
      }
      return false;
    };

    Container.prototype.get_next_char = function() {
      var cursor_end;
      cursor_end = this.codemirror.getCursor();
      cursor_end.ch++;
      return this.codemirror.getRange(this.codemirror.getCursor(), cursor_end);
    };

    Container.prototype.get_previous_char = function(less_value) {
      var cursor_end, cursor_start;
      cursor_start = this.codemirror.getCursor();
      cursor_end = this.codemirror.getCursor();
      if (less_value != null) {
        cursor_start.ch -= less_value;
        cursor_end.ch -= less_value - 1;
      } else {
        cursor_start.ch--;
      }
      if (cursor_start.ch < 0) {
        return null;
      }
      return this.codemirror.getRange(cursor_start, cursor_end);
    };

    Container.prototype.insert_next = function(str) {
      this.codemirror.replaceRange(str, this.codemirror.getCursor());
      return this.move_cursor(-1);
    };

    Container.prototype.remove_next = function() {
      var end_cursor;
      end_cursor = this.codemirror.getCursor();
      end_cursor.ch++;
      return this.codemirror.replaceRange('', this.codemirror.getCursor(), end_cursor);
    };

    Container.prototype.move_cursor = function(move_value) {
      var cursor;
      cursor = this.codemirror.getCursor();
      cursor.ch += move_value;
      if (cursor.ch < 0) {
        cursor.ch = 0;
      }
      return this.codemirror.setCursor(cursor);
    };

    Container.prototype.count_char = function(char_to_count) {
      var char, i, is_parsing_string, query, result, result_inline_comment, result_multiple_line_comment, string_delimiter, to_skip, _i, _len;
      query = this.codemirror.getValue();
      is_parsing_string = false;
      to_skip = 0;
      result = 0;
      for (i = _i = 0, _len = query.length; _i < _len; i = ++_i) {
        char = query[i];
        if (to_skip > 0) {
          to_skip--;
          continue;
        }
        if (is_parsing_string === true) {
          if (char === string_delimiter && (query[i - 1] != null) && query[i - 1] !== '\\') {
            is_parsing_string = false;
            if (char === char_to_count) {
              result++;
            }
          }
        } else {
          if (char === char_to_count) {
            result++;
          }
          if (char === '\'' || char === '"') {
            is_parsing_string = true;
            string_delimiter = char;
            continue;
          }
          result_inline_comment = this.regex.inline_comment.exec(query.slice(i));
          if (result_inline_comment != null) {
            to_skip = result_inline_comment[0].length - 1;
            continue;
          }
          result_multiple_line_comment = this.regex.multiple_line_comment.exec(query.slice(i));
          if (result_multiple_line_comment != null) {
            to_skip = result_multiple_line_comment[0].length - 1;
            continue;
          }
        }
      }
      return result;
    };

    Container.prototype.matching_opening_bracket = {
      '(': ')',
      '{': '}',
      '[': ']'
    };

    Container.prototype.matching_closing_bracket = {
      ')': '(',
      '}': '{',
      ']': '['
    };

    Container.prototype.count_not_closed_brackets = function(opening_char) {
      var char, i, is_parsing_string, query, result, result_inline_comment, result_multiple_line_comment, string_delimiter, to_skip, _i, _len;
      query = this.codemirror.getValue();
      is_parsing_string = false;
      to_skip = 0;
      result = 0;
      for (i = _i = 0, _len = query.length; _i < _len; i = ++_i) {
        char = query[i];
        if (to_skip > 0) {
          to_skip--;
          continue;
        }
        if (is_parsing_string === true) {
          if (char === string_delimiter && (query[i - 1] != null) && query[i - 1] !== '\\') {
            is_parsing_string = false;
          }
        } else {
          if (char === opening_char) {
            result++;
          } else if (char === this.matching_opening_bracket[opening_char]) {
            result--;
          }
          if (char === '\'' || char === '"') {
            is_parsing_string = true;
            string_delimiter = char;
            continue;
          }
          result_inline_comment = this.regex.inline_comment.exec(query.slice(i));
          if (result_inline_comment != null) {
            to_skip = result_inline_comment[0].length - 1;
            continue;
          }
          result_multiple_line_comment = this.regex.multiple_line_comment.exec(query.slice(i));
          if (result_multiple_line_comment != null) {
            to_skip = result_multiple_line_comment[0].length - 1;
            continue;
          }
        }
      }
      return result;
    };

    Container.prototype.handle_keypress = function(editor, event) {
      var cached_query, current_name, cursor, end_body, i, index, lines, move_outside, new_extra_suggestions, new_highlighted_suggestion, new_suggestions, next_char, previous_char, query, query_after_cursor, query_before_cursor, regex, result, result_last_char_is_white, result_non_white_char_after_cursor, stack, start_search, string_delimiter, suggestion, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
      if (this.ignored_next_keyup === true) {
        if ((event != null ? event.type : void 0) === 'keyup' && (event != null ? event.which : void 0) !== 9) {
          this.ignored_next_keyup = false;
        }
        return true;
      }
      this.state.focus_on_codemirror = true;
      if ((event != null ? event.type : void 0) === 'mouseup') {
        this.hide_suggestion_and_description();
      }
      this.state.current_query = this.codemirror.getValue();
      if ((event != null ? event.which : void 0) != null) {
        if (event.type !== 'keydown' && ((event.ctrlKey === true || event.metaKey === true) && event.which === 32)) {
          return true;
        }
        if (event.which === 27 || (event.type === 'keydown' && ((event.ctrlKey === true || event.metaKey === true) && event.which === 32) && (this.$('.suggestion_description').css('display') !== 'none' || this.$('.suggestion_name_list').css('display') !== 'none'))) {
          event.preventDefault();
          this.hide_suggestion_and_description();
          query_before_cursor = this.codemirror.getRange({
            line: 0,
            ch: 0
          }, this.codemirror.getCursor());
          query_after_cursor = this.codemirror.getRange(this.codemirror.getCursor(), {
            line: this.codemirror.lineCount() + 1,
            ch: 0
          });
          stack = this.extract_data_from_query({
            size_stack: 0,
            query: query_before_cursor,
            position: 0
          });
          if (stack === null) {
            this.ignore_tab_keyup = false;
            this.hide_suggestion_and_description();
            return false;
          }
          this.current_highlighted_suggestion = -1;
          this.current_highlighted_extra_suggestion = -1;
          this.$('.suggestion_name_list').empty();
          this.query_last_part = query_after_cursor;
          this.current_suggestions = [];
          this.current_element = '';
          this.current_extra_suggestion = '';
          this.written_suggestion = null;
          this.cursor_for_auto_completion = this.codemirror.getCursor();
          this.description = null;
          result = {
            status: null
          };
          this.create_suggestion({
            stack: stack,
            query: query_before_cursor,
            result: result
          });
          result.suggestions = this.uniq(result.suggestions);
          if (((_ref = result.suggestions) != null ? _ref.length : void 0) > 0) {
            _ref1 = result.suggestions;
            for (i = _i = 0, _len = _ref1.length; _i < _len; i = ++_i) {
              suggestion = _ref1[i];
              result.suggestions.sort();
              this.current_suggestions.push(suggestion);
              this.$('.suggestion_name_list').append(this.template_suggestion_name({
                id: i,
                suggestion: suggestion
              }));
            }
          } else if (result.description != null) {
            this.description = result.description;
          }
          return true;
        } else if (event.which === 13 && (event.shiftKey === false && event.ctrlKey === false && event.metaKey === false)) {
          if (event.type === 'keydown') {
            if (this.current_highlighted_suggestion > -1) {
              event.preventDefault();
              this.handle_keypress();
              return true;
            }
            previous_char = this.get_previous_char();
            if (previous_char in this.matching_opening_bracket) {
              next_char = this.get_next_char();
              if (this.matching_opening_bracket[previous_char] === next_char) {
                cursor = this.codemirror.getCursor();
                this.insert_next('\n');
                this.codemirror.indentLine(cursor.line + 1, 'smart');
                this.codemirror.setCursor(cursor);
                return false;
              }
            }
          }
        } else if (event.which === 9 || (event.type === 'keydown' && ((event.ctrlKey === true || event.metaKey === true) && event.which === 32) && (this.$('.suggestion_description').css('display') === 'none' && this.$('.suggestion_name_list').css('display') === 'none'))) {
          event.preventDefault();
          if (event.type !== 'keydown') {
            return false;
          } else {
            if (((_ref2 = this.current_suggestions) != null ? _ref2.length : void 0) > 0) {
              if (this.$('.suggestion_name_list').css('display') === 'none') {
                this.show_suggestion();
                return true;
              } else {
                if (this.written_suggestion === null) {
                  cached_query = this.query_first_part + this.current_element + this.query_last_part;
                } else {
                  cached_query = this.query_first_part + this.written_suggestion + this.query_last_part;
                }
                if (cached_query !== this.codemirror.getValue()) {
                  this.current_element = this.codemirror.getValue().slice(this.query_first_part.length, this.codemirror.getValue().length - this.query_last_part.length);
                  regex = this.create_safe_regex(this.current_element);
                  new_suggestions = [];
                  new_highlighted_suggestion = -1;
                  _ref3 = this.current_suggestions;
                  for (index = _j = 0, _len1 = _ref3.length; _j < _len1; index = ++_j) {
                    suggestion = _ref3[index];
                    if (index < this.current_highlighted_suggestion) {
                      new_highlighted_suggestion = new_suggestions.length;
                    }
                    if (regex.test(suggestion) === true) {
                      new_suggestions.push(suggestion);
                    }
                  }
                  this.current_suggestions = new_suggestions;
                  this.current_highlighted_suggestion = new_highlighted_suggestion;
                  if (this.current_suggestions.length > 0) {
                    this.$('.suggestion_name_list').empty();
                    _ref4 = this.current_suggestions;
                    for (i = _k = 0, _len2 = _ref4.length; _k < _len2; i = ++_k) {
                      suggestion = _ref4[i];
                      this.$('.suggestion_name_list').append(this.template_suggestion_name({
                        id: i,
                        suggestion: suggestion
                      }));
                    }
                    this.ignored_next_keyup = true;
                  } else {
                    this.hide_suggestion_and_description();
                  }
                }
                if (event.shiftKey) {
                  this.current_highlighted_suggestion--;
                  if (this.current_highlighted_suggestion < -1) {
                    this.current_highlighted_suggestion = this.current_suggestions.length - 1;
                  } else if (this.current_highlighted_suggestion < 0) {
                    this.show_suggestion_without_moving();
                    this.remove_highlight_suggestion();
                    this.write_suggestion({
                      suggestion_to_write: this.current_element
                    });
                    this.ignore_tab_keyup = true;
                    return true;
                  }
                } else {
                  this.current_highlighted_suggestion++;
                  if (this.current_highlighted_suggestion >= this.current_suggestions.length) {
                    this.show_suggestion_without_moving();
                    this.remove_highlight_suggestion();
                    this.write_suggestion({
                      suggestion_to_write: this.current_element
                    });
                    this.ignore_tab_keyup = true;
                    this.current_highlighted_suggestion = -1;
                    return true;
                  }
                }
                if (this.current_suggestions[this.current_highlighted_suggestion] != null) {
                  this.show_suggestion_without_moving();
                  this.highlight_suggestion(this.current_highlighted_suggestion);
                  this.write_suggestion({
                    suggestion_to_write: this.current_suggestions[this.current_highlighted_suggestion]
                  });
                  this.ignore_tab_keyup = true;
                  return true;
                }
              }
            } else if (this.description != null) {
              if (this.$('.suggestion_description').css('display') === 'none') {
                this.show_description();
                return true;
              }
              if ((this.extra_suggestions != null) && this.extra_suggestions.length > 0 && this.extra_suggestion.start_body === this.extra_suggestion.start_body) {
                if (((_ref5 = this.extra_suggestion) != null ? (_ref6 = _ref5.body) != null ? (_ref7 = _ref6[0]) != null ? _ref7.type : void 0 : void 0 : void 0) === 'string') {
                  if (this.extra_suggestion.body[0].complete === true) {
                    this.extra_suggestions = [];
                  } else {
                    current_name = this.extra_suggestion.body[0].name.replace(/^\s*('|")/, '').replace(/('|")\s*$/, '');
                    regex = this.create_safe_regex(current_name);
                    new_extra_suggestions = [];
                    _ref8 = this.extra_suggestions;
                    for (_l = 0, _len3 = _ref8.length; _l < _len3; _l++) {
                      suggestion = _ref8[_l];
                      if (regex.test(suggestion) === true) {
                        new_extra_suggestions.push(suggestion);
                      }
                    }
                    this.extra_suggestions = new_extra_suggestions;
                  }
                }
                if (this.extra_suggestions.length > 0) {
                  query = this.codemirror.getValue();
                  start_search = this.extra_suggestion.start_body;
                  if (((_ref9 = this.extra_suggestion.body) != null ? (_ref10 = _ref9[0]) != null ? _ref10.name.length : void 0 : void 0) != null) {
                    start_search += this.extra_suggestion.body[0].name.length;
                  }
                  end_body = query.indexOf(')', start_search);
                  this.query_last_part = '';
                  if (end_body !== -1) {
                    this.query_last_part = query.slice(end_body);
                  }
                  this.query_first_part = query.slice(0, this.extra_suggestion.start_body);
                  lines = this.query_first_part.split('\n');
                  if (event.shiftKey === true) {
                    this.current_highlighted_extra_suggestion--;
                  } else {
                    this.current_highlighted_extra_suggestion++;
                  }
                  if (this.current_highlighted_extra_suggestion >= this.extra_suggestions.length) {
                    this.current_highlighted_extra_suggestion = -1;
                  } else if (this.current_highlighted_extra_suggestion < -1) {
                    this.current_highlighted_extra_suggestion = this.extra_suggestions.length - 1;
                  }
                  suggestion = '';
                  if (this.current_highlighted_extra_suggestion === -1) {
                    if (this.current_extra_suggestion != null) {
                      if (/^\s*'/.test(this.current_extra_suggestion) === true) {
                        suggestion = this.current_extra_suggestion + "'";
                      } else if (/^\s*"/.test(this.current_extra_suggestion) === true) {
                        suggestion = this.current_extra_suggestion + '"';
                      }
                    }
                  } else {
                    if (this.state.options.electric_punctuation === false) {
                      move_outside = true;
                    }
                    if (/^\s*'/.test(this.current_extra_suggestion) === true) {
                      string_delimiter = "'";
                    } else if (/^\s*"/.test(this.current_extra_suggestion) === true) {
                      string_delimiter = '"';
                    } else {
                      string_delimiter = "'";
                      move_outside = true;
                    }
                    suggestion = string_delimiter + this.extra_suggestions[this.current_highlighted_extra_suggestion] + string_delimiter;
                  }
                  this.write_suggestion({
                    move_outside: move_outside,
                    suggestion_to_write: suggestion
                  });
                  this.ignore_tab_keyup = true;
                }
              }
            }
          }
        }
        if (event.which === 13 && (event.shiftKey || event.ctrlKey || event.metaKey)) {
          this.hide_suggestion_and_description();
          event.preventDefault();
          if (event.type !== 'keydown') {
            return true;
          }
          this.execute_query();
          return true;
        } else if ((event.ctrlKey || event.metaKey) && event.which === 86 && event.type === 'keydown') {
          this.last_action_is_paste = true;
          this.num_released_keys = 0;
          if (event.metaKey) {
            this.num_released_keys++;
          }
          this.hide_suggestion_and_description();
          return true;
        } else if (event.type === 'keyup' && this.last_action_is_paste === true && (event.which === 17 || event.which === 91)) {
          this.num_released_keys++;
          if (this.num_released_keys === 2) {
            this.last_action_is_paste = false;
          }
          this.hide_suggestion_and_description();
          return true;
        } else if (event.type === 'keyup' && this.last_action_is_paste === true && event.which === 86) {
          this.num_released_keys++;
          if (this.num_released_keys === 2) {
            this.last_action_is_paste = false;
          }
          this.hide_suggestion_and_description();
          return true;
        } else if (event.type === 'keyup' && event.altKey && event.which === 38) {
          if (this.history_displayed_id < this.state.history.length) {
            this.history_displayed_id++;
            this.codemirror.setValue(this.state.history[this.state.history.length - this.history_displayed_id].query);
            event.preventDefault();
            return true;
          }
        } else if (event.type === 'keyup' && event.altKey && event.which === 40) {
          if (this.history_displayed_id > 1) {
            this.history_displayed_id--;
            this.codemirror.setValue(this.state.history[this.state.history.length - this.history_displayed_id].query);
            event.preventDefault();
            return true;
          } else if (this.history_displayed_id === 1) {
            this.history_displayed_id--;
            this.codemirror.setValue(this.draft);
            this.codemirror.setCursor(this.codemirror.lineCount(), 0);
          }
        } else if (event.type === 'keyup' && event.altKey && event.which === 33) {
          this.history_displayed_id = this.state.history.length;
          this.codemirror.setValue(this.state.history[this.state.history.length - this.history_displayed_id].query);
          event.preventDefault();
          return true;
        } else if (event.type === 'keyup' && event.altKey && event.which === 34) {
          this.history_displayed_id = this.history.length;
          this.codemirror.setValue(this.state.history[this.state.history.length - this.history_displayed_id].query);
          this.codemirror.setCursor(this.codemirror.lineCount(), 0);
          event.preventDefault();
          return true;
        }
      }
      if (this.$('.suggestion_name_li_hl').length > 0) {
        if ((event != null ? event.which : void 0) === 13) {
          event.preventDefault();
          this.handle_keypress();
          return true;
        }
      }
      if (this.history_displayed_id !== 0 && (event != null)) {
        if (event.ctrlKey || event.shiftKey || event.altKey || event.which === 16 || event.which === 17 || event.which === 18 || event.which === 20 || (event.which === 91 && event.type !== 'keypress') || event.which === 92 || event.type in this.mouse_type_event) {
          return false;
        }
      }
      if ((event != null) && (event.which === 16 || event.which === 17 || event.which === 18 || event.which === 20 || (event.which === 91 && event.type !== 'keypress') || event.which === 92)) {
        return false;
      }
      if (!(event != null) || (event.which !== 37 && event.which !== 38 && event.which !== 39 && event.which !== 40 && event.which !== 33 && event.which !== 34 && event.which !== 35 && event.which !== 36 && event.which !== 0)) {
        this.history_displayed_id = 0;
        this.draft = this.codemirror.getValue();
      }
      if (this.codemirror.getValue().length > this.max_size_query) {
        return false;
      }
      query_before_cursor = this.codemirror.getRange({
        line: 0,
        ch: 0
      }, this.codemirror.getCursor());
      query_after_cursor = this.codemirror.getRange(this.codemirror.getCursor(), {
        line: this.codemirror.lineCount() + 1,
        ch: 0
      });
      stack = this.extract_data_from_query({
        size_stack: 0,
        query: query_before_cursor,
        position: 0
      });
      if (stack === null) {
        this.ignore_tab_keyup = false;
        this.hide_suggestion_and_description();
        return false;
      }
      if (this.state.options.electric_punctuation === true) {
        this.pair_char(event, stack);
      }
      if (((event != null ? event.type : void 0) != null) && event.type !== 'keyup' && event.which !== 9 && event.type !== 'mouseup') {
        return false;
      }
      if ((event != null ? event.which : void 0) === 16) {
        return false;
      }
      if (this.ignore_tab_keyup === true && (event != null ? event.which : void 0) === 9) {
        if (event.type === 'keyup') {
          this.ignore_tab_keyup = false;
        }
        return true;
      }
      this.current_highlighted_suggestion = -1;
      this.current_highlighted_extra_suggestion = -1;
      this.$('.suggestion_name_list').empty();
      this.query_last_part = query_after_cursor;
      if (this.codemirror.getSelection() !== '') {
        this.hide_suggestion_and_description();
        if ((event != null) && event.which === 13 && (event.shiftKey || event.ctrlKey || event.metaKey)) {
          this.hide_suggestion_and_description();
          if (event.type !== 'keydown') {
            return true;
          }
          this.execute_query();
          return true;
        }
        if ((event != null ? event.type : void 0) !== 'mouseup') {
          return false;
        } else {
          return true;
        }
      }
      this.current_suggestions = [];
      this.current_element = '';
      this.current_extra_suggestion = '';
      this.written_suggestion = null;
      this.cursor_for_auto_completion = this.codemirror.getCursor();
      this.description = null;
      result = {
        status: null
      };
      result_non_white_char_after_cursor = this.regex.get_first_non_white_char.exec(query_after_cursor);
      if (result_non_white_char_after_cursor !== null && !(((_ref11 = result_non_white_char_after_cursor[1]) != null ? _ref11[0] : void 0) in this.char_breakers || ((_ref12 = result_non_white_char_after_cursor[1]) != null ? _ref12.match(/^((\/\/)|(\/\*))/) : void 0) !== null)) {
        result.status = 'break_and_look_for_description';
        this.hide_suggestion();
      } else {
        result_last_char_is_white = this.regex.last_char_is_white.exec(query_before_cursor[query_before_cursor.length - 1]);
        if (result_last_char_is_white !== null) {
          result.status = 'break_and_look_for_description';
          this.hide_suggestion();
        }
      }
      this.create_suggestion({
        stack: stack,
        query: query_before_cursor,
        result: result
      });
      result.suggestions = this.uniq(result.suggestions);
      if (((_ref13 = result.suggestions) != null ? _ref13.length : void 0) > 0) {
        _ref14 = result.suggestions;
        for (i = _m = 0, _len4 = _ref14.length; _m < _len4; i = ++_m) {
          suggestion = _ref14[i];
          this.current_suggestions.push(suggestion);
          this.$('.suggestion_name_list').append(this.template_suggestion_name({
            id: i,
            suggestion: suggestion
          }));
        }
        if (this.state.options.suggestions === true) {
          this.show_suggestion();
        } else {
          this.hide_suggestion();
        }
        this.hide_description();
      } else if (result.description != null) {
        this.hide_suggestion();
        this.description = result.description;
        if (this.state.options.suggestions === true && (event != null ? event.type : void 0) !== 'mouseup') {
          this.show_description();
        } else {
          this.hide_description();
        }
      } else {
        this.hide_suggestion_and_description();
      }
      if ((event != null ? event.which : void 0) === 9) {
        if (this.last_element_type_if_incomplete(stack) !== 'string' && this.regex.white_or_empty.test(this.codemirror.getLine(this.codemirror.getCursor().line).slice(0, this.codemirror.getCursor().ch)) !== true) {
          return true;
        } else {
          return false;
        }
      }
      return true;
    };

    Container.prototype.uniq = function(ar) {
      var element, hash, key, result, _i, _len;
      if (!(ar != null) || ar.length === 0) {
        return ar;
      }
      result = [];
      hash = {};
      for (_i = 0, _len = ar.length; _i < _len; _i++) {
        element = ar[_i];
        hash[element] = true;
      }
      for (key in hash) {
        result.push(key);
      }
      result.sort();
      return result;
    };

    Container.prototype.regex = {
      anonymous: /^(\s)*function\(([a-zA-Z0-9,\s]*)\)(\s)*{/,
      loop: /^(\s)*(for|while)(\s)*\(([^\)]*)\)(\s)*{/,
      method: /^(\s)*([a-zA-Z0-9]*)\(/,
      row: /^(\s)*row\(/,
      method_var: /^(\s)*(\d*[a-zA-Z][a-zA-Z0-9]*)\./,
      "return": /^(\s)*return(\s)*/,
      object: /^(\s)*{(\s)*/,
      array: /^(\s)*\[(\s)*/,
      white: /^(\s)+$/,
      white_or_empty: /^(\s)*$/,
      white_replace: /\s/g,
      white_start: /^(\s)+/,
      comma: /^(\s)*,(\s)*/,
      semicolon: /^(\s)*;(\s)*/,
      number: /^[0-9]+\.?[0-9]*/,
      inline_comment: /^(\s)*\/\/.*\n/,
      multiple_line_comment: /^(\s)*\/\*[^(\*\/)]*\*\//,
      get_first_non_white_char: /\s*(\S+)/,
      last_char_is_white: /.*(\s+)$/
    };

    Container.prototype.stop_char = {
      opening: {
        '(': ')',
        '{': '}',
        '[': ']'
      },
      closing: {
        ')': '(',
        '}': '{',
        ']': '['
      }
    };

    Container.prototype.last_element_type_if_incomplete = function(stack) {
      var element;
      if ((!(stack != null)) || stack.length === 0) {
        return '';
      }
      element = stack[stack.length - 1];
      if (element.body != null) {
        return this.last_element_type_if_incomplete(element.body);
      } else {
        if (element.complete === false) {
          return element.type;
        } else {
          return '';
        }
      }
    };

    Container.prototype.get_last_key = function(stack) {
      var element;
      if ((!(stack != null)) || stack.length === 0) {
        return '';
      }
      element = stack[stack.length - 1];
      if (element.body != null) {
        return this.get_last_key(element.body);
      } else {
        if (element.complete === false && (element.key != null)) {
          return element.key;
        } else {
          return '';
        }
      }
    };

    Container.prototype.extract_data_from_query = function(args) {
      var arg, body, body_start, char, context, element, entry_start, i, is_parsing_string, keys_values, list_args, new_context, new_element, new_start, position, position_opening_parenthesis, query, result_inline_comment, result_multiple_line_comment, result_regex, result_regex_row, result_white, size_stack, stack, stack_stop_char, start, string_delimiter, to_skip, _i, _j, _len, _len1, _ref, _ref1, _ref2;
      size_stack = args.size_stack;
      query = args.query;
      context = args.context != null ? DataUtils.deep_copy(args.context) : {};
      position = args.position;
      stack = [];
      element = {
        type: null,
        context: context,
        complete: false
      };
      start = 0;
      is_parsing_string = false;
      to_skip = 0;
      for (i = _i = 0, _len = query.length; _i < _len; i = ++_i) {
        char = query[i];
        if (to_skip > 0) {
          to_skip--;
          continue;
        }
        if (is_parsing_string === true) {
          if (char === string_delimiter && (query[i - 1] != null) && query[i - 1] !== '\\') {
            is_parsing_string = false;
            if (element.type === 'string') {
              element.name = query.slice(start, i + 1);
              element.complete = true;
              stack.push(element);
              size_stack++;
              if (size_stack > this.max_size_stack) {
                return null;
              }
              element = {
                type: null,
                context: context,
                complete: false
              };
              start = i + 1;
            }
          }
        } else {
          if (char === '\'' || char === '"') {
            is_parsing_string = true;
            string_delimiter = char;
            if (element.type === null) {
              element.type = 'string';
              start = i;
            }
            continue;
          }
          if (element.type === null) {
            result_inline_comment = this.regex.inline_comment.exec(query.slice(i));
            if (result_inline_comment != null) {
              to_skip = result_inline_comment[0].length - 1;
              start += result_inline_comment[0].length;
              continue;
            }
            result_multiple_line_comment = this.regex.multiple_line_comment.exec(query.slice(i));
            if (result_multiple_line_comment != null) {
              to_skip = result_multiple_line_comment[0].length - 1;
              start += result_multiple_line_comment[0].length;
              continue;
            }
            if (start === i) {
              result_white = this.regex.white_start.exec(query.slice(i));
              if (result_white != null) {
                to_skip = result_white[0].length - 1;
                start += result_white[0].length;
                continue;
              }
              result_regex = this.regex.anonymous.exec(query.slice(i));
              if (result_regex !== null) {
                element.type = 'anonymous_function';
                list_args = (_ref = result_regex[2]) != null ? _ref.split(',') : void 0;
                element.args = [];
                new_context = DataUtils.deep_copy(context);
                for (_j = 0, _len1 = list_args.length; _j < _len1; _j++) {
                  arg = list_args[_j];
                  arg = arg.replace(/(^\s*)|(\s*$)/gi, "");
                  new_context[arg] = true;
                  element.args.push(arg);
                }
                element.context = new_context;
                to_skip = result_regex[0].length;
                body_start = i + result_regex[0].length;
                stack_stop_char = ['{'];
                continue;
              }
              result_regex = this.regex.loop.exec(query.slice(i));
              if (result_regex !== null) {
                element.type = 'loop';
                element.context = context;
                to_skip = result_regex[0].length;
                body_start = i + result_regex[0].length;
                stack_stop_char = ['{'];
                continue;
              }
              result_regex = this.regex["return"].exec(query.slice(i));
              if (result_regex !== null) {
                element.type = 'return';
                element.complete = true;
                to_skip = result_regex[0].length - 1;
                stack.push(element);
                size_stack++;
                if (size_stack > this.max_size_stack) {
                  return null;
                }
                element = {
                  type: null,
                  context: context,
                  complete: false
                };
                start = i + result_regex[0].length;
                continue;
              }
              result_regex = this.regex.object.exec(query.slice(i));
              if (result_regex !== null) {
                element.type = 'object';
                element.next_key = null;
                element.body = [];
                element.current_key_start = i + result_regex[0].length;
                to_skip = result_regex[0].length - 1;
                stack_stop_char = ['{'];
                continue;
              }
              result_regex = this.regex.array.exec(query.slice(i));
              if (result_regex !== null) {
                element.type = 'array';
                element.next_key = null;
                element.body = [];
                entry_start = i + result_regex[0].length;
                to_skip = result_regex[0].length - 1;
                stack_stop_char = ['['];
                continue;
              }
              if (char === '.') {
                new_start = i + 1;
              } else {
                new_start = i;
              }
              result_regex = this.regex.method.exec(query.slice(new_start));
              if (result_regex !== null) {
                result_regex_row = this.regex.row.exec(query.slice(new_start));
                if (result_regex_row !== null) {
                  position_opening_parenthesis = result_regex_row[0].indexOf('(');
                  element.type = 'function';
                  element.name = 'row';
                  stack.push(element);
                  size_stack++;
                  if (size_stack > this.max_size_stack) {
                    return null;
                  }
                  element = {
                    type: 'function',
                    name: '(',
                    position: position + 3 + 1,
                    context: context,
                    complete: 'false'
                  };
                  stack_stop_char = ['('];
                  start += position_opening_parenthesis;
                  to_skip = result_regex[0].length - 1 + new_start - i;
                  continue;
                } else {
                  if (((_ref1 = stack[stack.length - 1]) != null ? _ref1.type : void 0) === 'function' || ((_ref2 = stack[stack.length - 1]) != null ? _ref2.type : void 0) === 'var') {
                    element.type = 'function';
                    element.name = result_regex[0];
                    element.position = position + new_start;
                    start += new_start - i;
                    to_skip = result_regex[0].length - 1 + new_start - i;
                    stack_stop_char = ['('];
                    continue;
                  } else {
                    position_opening_parenthesis = result_regex[0].indexOf('(');
                    if (position_opening_parenthesis !== -1 && result_regex[0].slice(0, position_opening_parenthesis) in context) {
                      element.real_type = this.types.value;
                      element.type = 'var';
                      element.name = result_regex[0].slice(0, position_opening_parenthesis);
                      stack.push(element);
                      size_stack++;
                      if (size_stack > this.max_size_stack) {
                        return null;
                      }
                      element = {
                        type: 'function',
                        name: '(',
                        position: position + position_opening_parenthesis + 1,
                        context: context,
                        complete: 'false'
                      };
                      stack_stop_char = ['('];
                      start = position_opening_parenthesis;
                      to_skip = result_regex[0].length - 1;
                      continue;
                    }
                    /*
                                                            # This last condition is a special case for r(expr)
                                                            else if position_opening_parenthesis isnt -1 and result_regex[0].slice(0, position_opening_parenthesis) is 'r'
                                                                element.type = 'var'
                                                                element.name = 'r'
                                                                element.real_type = @types.value
                                                                element.position = position+new_start
                                                                start += new_start-i
                                                                to_skip = result_regex[0].length-1+new_start-i
                                                                stack_stop_char = ['(']
                                                                continue
                    */

                  }
                }
              }
              result_regex = this.regex.method_var.exec(query.slice(new_start));
              if (result_regex !== null) {
                if (result_regex[0].slice(0, result_regex[0].length - 1) in context) {
                  element.type = 'var';
                  element.real_type = this.types.value;
                } else {
                  element.type = 'function';
                }
                element.position = position + new_start;
                element.name = result_regex[0].slice(0, result_regex[0].length - 1).replace(/\s/, '');
                element.complete = true;
                to_skip = element.name.length - 1 + new_start - i;
                stack.push(element);
                size_stack++;
                if (size_stack > this.max_size_stack) {
                  return null;
                }
                element = {
                  type: null,
                  context: context,
                  complete: false
                };
                start = new_start + to_skip + 1;
                start -= new_start - i;
                continue;
              }
              result_regex = this.regex.comma.exec(query.slice(i));
              if (result_regex !== null) {
                element.complete = true;
                stack.push({
                  type: 'separator',
                  complete: true,
                  name: query.slice(i, result_regex[0].length)
                });
                size_stack++;
                if (size_stack > this.max_size_stack) {
                  return null;
                }
                element = {
                  type: null,
                  context: context,
                  complete: false
                };
                start = i + result_regex[0].length - 1 + 1;
                to_skip = result_regex[0].length - 1;
                continue;
              }
              result_regex = this.regex.semicolon.exec(query.slice(i));
              if (result_regex !== null) {
                element.complete = true;
                stack.push({
                  type: 'separator',
                  complete: true,
                  name: query.slice(i, result_regex[0].length)
                });
                size_stack++;
                if (size_stack > this.max_size_stack) {
                  return null;
                }
                element = {
                  type: null,
                  context: context,
                  complete: false
                };
                start = i + result_regex[0].length - 1 + 1;
                to_skip = result_regex[0].length - 1;
                continue;
              }
            } else {
              if (char === ';') {
                start = i + 1;
              }
            }
          } else {
            result_regex = this.regex.comma.exec(query.slice(i));
            if (result_regex !== null && stack_stop_char.length < 1) {
              stack.push({
                type: 'separator',
                complete: true,
                name: query.slice(i, result_regex[0].length),
                position: position + i
              });
              size_stack++;
              if (size_stack > this.max_size_stack) {
                return null;
              }
              element = {
                type: null,
                context: context,
                complete: false
              };
              start = i + result_regex[0].length - 1;
              to_skip = result_regex[0].length - 1;
              continue;
            } else if (element.type === 'anonymous_function') {
              if (char in this.stop_char.opening) {
                stack_stop_char.push(char);
              } else if (char in this.stop_char.closing) {
                if (stack_stop_char[stack_stop_char.length - 1] === this.stop_char.closing[char]) {
                  stack_stop_char.pop();
                  if (stack_stop_char.length === 0) {
                    element.body = this.extract_data_from_query({
                      size_stack: size_stack,
                      query: query.slice(body_start, i),
                      context: element.context,
                      position: position + body_start
                    });
                    if (element.body === null) {
                      return null;
                    }
                    element.complete = true;
                    stack.push(element);
                    size_stack++;
                    if (size_stack > this.max_size_stack) {
                      return null;
                    }
                    element = {
                      type: null,
                      context: context
                    };
                    start = i + 1;
                  }
                }
              }
            } else if (element.type === 'loop') {
              if (char in this.stop_char.opening) {
                stack_stop_char.push(char);
              } else if (char in this.stop_char.closing) {
                if (stack_stop_char[stack_stop_char.length - 1] === this.stop_char.closing[char]) {
                  stack_stop_char.pop();
                  if (stack_stop_char.length === 0) {
                    element.body = this.extract_data_from_query({
                      size_stack: size_stack,
                      query: query.slice(body_start, i),
                      context: element.context,
                      position: position + body_start
                    });
                    if (element.body) {
                      return null;
                    }
                    element.complete = true;
                    stack.push(element);
                    size_stack++;
                    if (size_stack > this.max_size_stack) {
                      return null;
                    }
                    element = {
                      type: null,
                      context: context
                    };
                    start = i + 1;
                  }
                }
              }
            } else if (element.type === 'function') {
              if (char in this.stop_char.opening) {
                stack_stop_char.push(char);
              } else if (char in this.stop_char.closing) {
                if (stack_stop_char[stack_stop_char.length - 1] === this.stop_char.closing[char]) {
                  stack_stop_char.pop();
                  if (stack_stop_char.length === 0) {
                    element.body = this.extract_data_from_query({
                      size_stack: size_stack,
                      query: query.slice(start + element.name.length, i),
                      context: element.context,
                      position: position + start + element.name.length
                    });
                    if (element.body === null) {
                      return null;
                    }
                    element.complete = true;
                    stack.push(element);
                    size_stack++;
                    if (size_stack > this.max_size_stack) {
                      return null;
                    }
                    element = {
                      type: null,
                      context: context
                    };
                    start = i + 1;
                  }
                }
              }
            } else if (element.type === 'object') {
              keys_values = [];
              if (char in this.stop_char.opening) {
                stack_stop_char.push(char);
              } else if (char in this.stop_char.closing) {
                if (stack_stop_char[stack_stop_char.length - 1] === this.stop_char.closing[char]) {
                  stack_stop_char.pop();
                  if (stack_stop_char.length === 0) {
                    if (element.next_key != null) {
                      body = this.extract_data_from_query({
                        size_stack: size_stack,
                        query: query.slice(element.current_value_start, i),
                        context: element.context,
                        position: position + element.current_value_start
                      });
                      if (body === null) {
                        return null;
                      }
                      new_element = {
                        type: 'object_key',
                        key: element.next_key,
                        key_complete: true,
                        complete: false,
                        body: body
                      };
                      element.body[element.body.length - 1] = new_element;
                    }
                    element.next_key = null;
                    element.complete = true;
                    stack.push(element);
                    size_stack++;
                    if (size_stack > this.max_size_stack) {
                      return null;
                    }
                    element = {
                      type: null,
                      context: context
                    };
                    start = i + 1;
                    continue;
                  }
                }
              }
              if (!(element.next_key != null)) {
                if (stack_stop_char.length === 1 && char === ':') {
                  new_element = {
                    type: 'object_key',
                    key: query.slice(element.current_key_start, i),
                    key_complete: true
                  };
                  if (element.body.length === 0) {
                    element.body.push(new_element);
                    size_stack++;
                    if (size_stack > this.max_size_stack) {
                      return null;
                    }
                  } else {
                    element.body[element.body.length - 1] = new_element;
                  }
                  element.next_key = query.slice(element.current_key_start, i);
                  element.current_value_start = i + 1;
                }
              } else {
                result_regex = this.regex.comma.exec(query.slice(i));
                if (stack_stop_char.length === 1 && result_regex !== null) {
                  body = this.extract_data_from_query({
                    size_stack: size_stack,
                    query: query.slice(element.current_value_start, i),
                    context: element.context,
                    position: element.current_value_start
                  });
                  if (body === null) {
                    return null;
                  }
                  new_element = {
                    type: 'object_key',
                    key: element.next_key,
                    key_complete: true,
                    body: body
                  };
                  element.body[element.body.length - 1] = new_element;
                  to_skip = result_regex[0].length - 1;
                  element.next_key = null;
                  element.current_key_start = i + result_regex[0].length;
                }
              }
            } else if (element.type === 'array') {
              if (char in this.stop_char.opening) {
                stack_stop_char.push(char);
              } else if (char in this.stop_char.closing) {
                if (stack_stop_char[stack_stop_char.length - 1] === this.stop_char.closing[char]) {
                  stack_stop_char.pop();
                  if (stack_stop_char.length === 0) {
                    body = this.extract_data_from_query({
                      size_stack: size_stack,
                      query: query.slice(entry_start, i),
                      context: element.context,
                      position: position + entry_start
                    });
                    if (body === null) {
                      return null;
                    }
                    new_element = {
                      type: 'array_entry',
                      complete: true,
                      body: body
                    };
                    if (new_element.body.length > 0) {
                      element.body.push(new_element);
                      size_stack++;
                      if (size_stack > this.max_size_stack) {
                        return null;
                      }
                    }
                    continue;
                  }
                }
              }
              if (stack_stop_char.length === 1 && char === ',') {
                body = this.extract_data_from_query({
                  size_stack: size_stack,
                  query: query.slice(entry_start, i),
                  context: element.context,
                  position: position + entry_start
                });
                if (body === null) {
                  return null;
                }
                new_element = {
                  type: 'array_entry',
                  complete: true,
                  body: body
                };
                if (new_element.body.length > 0) {
                  element.body.push(new_element);
                  size_stack++;
                  if (size_stack > this.max_size_stack) {
                    return null;
                  }
                }
                entry_start = i + 1;
              }
            }
          }
        }
      }
      if (element.type !== null) {
        element.complete = false;
        if (element.type === 'function') {
          element.body = this.extract_data_from_query({
            size_stack: size_stack,
            query: query.slice(start + element.name.length),
            context: element.context,
            position: position + start + element.name.length
          });
          if (element.body === null) {
            return null;
          }
        } else if (element.type === 'anonymous_function') {
          element.body = this.extract_data_from_query({
            size_stack: size_stack,
            query: query.slice(body_start),
            context: element.context,
            position: position + body_start
          });
          if (element.body === null) {
            return null;
          }
        } else if (element.type === 'loop') {
          element.body = this.extract_data_from_query({
            size_stack: size_stack,
            query: query.slice(body_start),
            context: element.context,
            position: position + body_start
          });
          if (element.body === null) {
            return null;
          }
        } else if (element.type === 'string') {
          element.name = query.slice(start);
        } else if (element.type === 'object') {
          if (!(element.next_key != null)) {
            new_element = {
              type: 'object_key',
              key: query.slice(element.current_key_start),
              key_complete: false,
              complete: false
            };
            element.body.push(new_element);
            size_stack++;
            if (size_stack > this.max_size_stack) {
              return null;
            }
            element.next_key = query.slice(element.current_key_start);
          } else {
            body = this.extract_data_from_query({
              size_stack: size_stack,
              query: query.slice(element.current_value_start),
              context: element.context,
              position: position + element.current_value_start
            });
            if (body === null) {
              return null;
            }
            new_element = {
              type: 'object_key',
              key: element.next_key,
              key_complete: true,
              complete: false,
              body: body
            };
            element.body[element.body.length - 1] = new_element;
            element.next_key = null;
          }
        } else if (element.type === 'array') {
          body = this.extract_data_from_query({
            size_stack: size_stack,
            query: query.slice(entry_start),
            context: element.context,
            position: position + entry_start
          });
          if (body === null) {
            return null;
          }
          new_element = {
            type: 'array_entry',
            complete: false,
            body: body
          };
          if (new_element.body.length > 0) {
            element.body.push(new_element);
            size_stack++;
            if (size_stack > this.max_size_stack) {
              return null;
            }
          }
        }
        stack.push(element);
        size_stack++;
        if (size_stack > this.max_size_stack) {
          return null;
        }
      } else if (start !== i) {
        if (query.slice(start) in element.context) {
          element.name = query.slice(start);
          element.type = 'var';
          element.real_type = this.types.value;
          element.complete = true;
        } else if (this.regex.number.test(query.slice(start)) === true) {
          element.type = 'number';
          element.name = query.slice(start);
          element.complete = true;
        } else if (query[start] === '.') {
          element.type = 'function';
          element.position = position + start;
          element.name = query.slice(start + 1);
          element.complete = false;
        } else {
          element.name = query.slice(start);
          element.position = position + start;
          element.complete = false;
        }
        stack.push(element);
        size_stack++;
        if (size_stack > this.max_size_stack) {
          return null;
        }
      }
      return stack;
    };

    Container.prototype.create_suggestion = function(args) {
      var element, i, query, result, stack, state, suggestion, type, _i, _j, _k, _l, _len, _len1, _len2, _len3, _len4, _m, _n, _ref, _ref1, _ref10, _ref11, _ref12, _ref13, _ref14, _ref15, _ref16, _ref17, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9, _results;
      stack = args.stack;
      query = args.query;
      result = args.result;
      if (result.status === null && stack.length === 0) {
        result.suggestions = [];
        result.status = 'done';
        this.query_first_part = '';
        if (this.suggestions[''] != null) {
          _ref = this.suggestions[''];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            suggestion = _ref[_i];
            result.suggestions.push(suggestion);
          }
        }
      }
      _results = [];
      for (i = _j = _ref1 = stack.length - 1; _j >= 0; i = _j += -1) {
        element = stack[i];
        if ((element.body != null) && element.body.length > 0 && element.complete === false) {
          this.create_suggestion({
            stack: element.body,
            query: args != null ? args.query : void 0,
            result: args.result
          });
        }
        if (result.status === 'done') {
          continue;
        }
        if (result.status === null) {
          if (element.complete === true) {
            if (element.type === 'function') {
              if (element.complete === true || element.name === '') {
                result.suggestions = null;
                result.status = 'look_for_description';
                break;
              } else {
                result.suggestions = null;
                result.description = element.name;
                this.extra_suggestion = {
                  start_body: element.position + element.name.length,
                  body: element.body
                };
                if (((_ref2 = element.body) != null ? (_ref3 = _ref2[0]) != null ? (_ref4 = _ref3.name) != null ? _ref4.length : void 0 : void 0 : void 0) != null) {
                  this.cursor_for_auto_completion.ch -= element.body[0].name.length;
                  this.current_extra_suggestion = element.body[0].name;
                }
                result.status = 'done';
              }
            } else if (element.type === 'anonymous_function' || element.type === 'separator' || element.type === 'object' || element.type === 'object_key' || element.type === 'return' || 'element.type' === 'array') {
              result.suggestions = null;
              result.status = 'look_for_description';
              break;
            }
          } else {
            if (element.type === 'function') {
              if (element.body != null) {
                result.suggestions = null;
                result.description = element.name;
                this.extra_suggestion = {
                  start_body: element.position + element.name.length,
                  body: element.body
                };
                if (((_ref5 = element.body) != null ? (_ref6 = _ref5[0]) != null ? (_ref7 = _ref6.name) != null ? _ref7.length : void 0 : void 0 : void 0) != null) {
                  this.cursor_for_auto_completion.ch -= element.body[0].name.length;
                  this.current_extra_suggestion = element.body[0].name;
                }
                result.status = 'done';
                break;
              } else {
                result.suggestions = [];
                result.suggestions_regex = this.create_safe_regex(element.name);
                result.description = null;
                this.query_first_part = query.slice(0, element.position + 1);
                this.current_element = element.name;
                this.cursor_for_auto_completion.ch -= element.name.length;
                this.current_query;
                if (i !== 0) {
                  result.status = 'look_for_state';
                } else {
                  result.state = '';
                }
              }
            } else if (element.type === 'anonymous_function' || element.type === 'object_key' || element.type === 'string' || element.type === 'separator' || element.type === 'array') {
              result.suggestions = null;
              result.status = 'look_for_description';
              break;
            } else if (element.type === null) {
              result.suggestions = [];
              result.status = 'look_for_description';
              break;
            }
          }
        } else if (result.status === 'look_for_description') {
          if (element.type === 'function') {
            result.description = element.name;
            this.extra_suggestion = {
              start_body: element.position + element.name.length,
              body: element.body
            };
            if (((_ref8 = element.body) != null ? (_ref9 = _ref8[0]) != null ? (_ref10 = _ref9.name) != null ? _ref10.length : void 0 : void 0 : void 0) != null) {
              this.cursor_for_auto_completion.ch -= element.body[0].name.length;
              this.current_extra_suggestion = element.body[0].name;
            }
            result.suggestions = null;
            result.status = 'done';
          } else {
            break;
          }
        }
        if (result.status === 'break_and_look_for_description') {
          if (element.type === 'function' && element.complete === false && element.name.indexOf('(') !== -1) {
            result.description = element.name;
            this.extra_suggestion = {
              start_body: element.position + element.name.length,
              body: element.body
            };
            if (((_ref11 = element.body) != null ? (_ref12 = _ref11[0]) != null ? (_ref13 = _ref12.name) != null ? _ref13.length : void 0 : void 0 : void 0) != null) {
              this.cursor_for_auto_completion.ch -= element.body[0].name.length;
              this.current_extra_suggestion = element.body[0].name;
            }
            result.suggestions = null;
            _results.push(result.status = 'done');
          } else {
            if (element.type !== 'function') {
              break;
            } else {
              result.status = 'look_for_description';
              break;
            }
          }
        } else if (result.status === 'look_for_state') {
          if (element.type === 'function' && element.complete === true) {
            result.state = element.name;
            if (this.map_state[element.name] != null) {
              _ref14 = this.map_state[element.name];
              for (_k = 0, _len1 = _ref14.length; _k < _len1; _k++) {
                state = _ref14[_k];
                if (this.suggestions[state] != null) {
                  _ref15 = this.suggestions[state];
                  for (_l = 0, _len2 = _ref15.length; _l < _len2; _l++) {
                    suggestion = _ref15[_l];
                    if (result.suggestions_regex.test(suggestion) === true) {
                      result.suggestions.push(suggestion);
                    }
                  }
                }
              }
            }
            _results.push(result.status = 'done');
          } else if (element.type === 'var' && element.complete === true) {
            result.state = element.real_type;
            _ref16 = result.state;
            for (_m = 0, _len3 = _ref16.length; _m < _len3; _m++) {
              type = _ref16[_m];
              if (this.suggestions[type] != null) {
                _ref17 = this.suggestions[type];
                for (_n = 0, _len4 = _ref17.length; _n < _len4; _n++) {
                  suggestion = _ref17[_n];
                  if (result.suggestions_regex.test(suggestion) === true) {
                    result.suggestions.push(suggestion);
                  }
                }
              }
            }
            _results.push(result.status = 'done');
          } else {
            _results.push(void 0);
          }
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Container.prototype.create_safe_regex = function(str) {
      var char, _i, _len, _ref;
      _ref = this.unsafe_to_safe_regexstr;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        char = _ref[_i];
        str = str.replace(char[0], char[1]);
      }
      return new RegExp('^(' + str + ')', 'i');
    };

    Container.prototype.show_suggestion = function() {
      var margin;
      this.move_suggestion();
      margin = (parseInt(this.$('.CodeMirror-cursor').css('top').replace('px', '')) + this.line_height) + 'px';
      this.$('.suggestion_full_container').css('margin-top', margin);
      this.$('.arrow').css('margin-top', margin);
      this.$('.suggestion_name_list').show();
      return this.$('.arrow').show();
    };

    Container.prototype.show_suggestion_without_moving = function() {
      this.$('.arrow').show();
      return this.$('.suggestion_name_list').show();
    };

    Container.prototype.show_description = function() {
      var margin;
      if (this.descriptions[this.description] != null) {
        margin = (parseInt(this.$('.CodeMirror-cursor').css('top').replace('px', '')) + this.line_height) + 'px';
        this.$('.suggestion_full_container').css('margin-top', margin);
        this.$('.arrow').css('margin-top', margin);
        this.$('.suggestion_description').html(this.description_template(this.extend_description(this.description)));
        this.$('.suggestion_description').show();
        this.move_suggestion();
        return this.show_or_hide_arrow();
      } else {
        return this.hide_description();
      }
    };

    Container.prototype.hide_suggestion = function() {
      this.$('.suggestion_name_list').hide();
      return this.show_or_hide_arrow();
    };

    Container.prototype.hide_description = function() {
      this.$('.suggestion_description').hide();
      return this.show_or_hide_arrow();
    };

    Container.prototype.hide_suggestion_and_description = function() {
      this.hide_suggestion();
      return this.hide_description();
    };

    Container.prototype.show_or_hide_arrow = function() {
      if (this.$('.suggestion_name_list').css('display') === 'none' && this.$('.suggestion_description').css('display') === 'none') {
        return this.$('.arrow').hide();
      } else {
        return this.$('.arrow').show();
      }
    };

    Container.prototype.move_suggestion = function() {
      var margin_left, margin_left_bloc, max_margin;
      margin_left = parseInt(this.$('.CodeMirror-cursor').css('left').replace('px', '')) + 23;
      this.$('.arrow').css('margin-left', margin_left);
      if (margin_left < 200) {
        return this.$('.suggestion_full_container').css('left', '0px');
      } else {
        max_margin = this.$('.CodeMirror-scroll').width() - 418;
        margin_left_bloc = Math.min(max_margin, Math.floor(margin_left / 200) * 200);
        if (margin_left > max_margin + 418 - 150 - 23) {
          return this.$('.suggestion_full_container').css('left', (max_margin - 34) + 'px');
        } else if (margin_left_bloc > max_margin - 150 - 23) {
          return this.$('.suggestion_full_container').css('left', (max_margin - 34 - 150) + 'px');
        } else {
          return this.$('.suggestion_full_container').css('left', (margin_left_bloc - 100) + 'px');
        }
      }
    };

    Container.prototype.highlight_suggestion = function(id) {
      this.remove_highlight_suggestion();
      this.$('.suggestion_name_li').eq(id).addClass('suggestion_name_li_hl');
      this.$('.suggestion_description').html(this.description_template(this.extend_description(this.current_suggestions[id])));
      return this.$('.suggestion_description').show();
    };

    Container.prototype.remove_highlight_suggestion = function() {
      return this.$('.suggestion_name_li').removeClass('suggestion_name_li_hl');
    };

    Container.prototype.write_suggestion = function(args) {
      var ch, move_outside, suggestion_to_write;
      suggestion_to_write = args.suggestion_to_write;
      move_outside = args.move_outside === true;
      ch = this.cursor_for_auto_completion.ch + suggestion_to_write.length;
      if (this.state.options.electric_punctuation === true) {
        if (suggestion_to_write[suggestion_to_write.length - 1] === '(' && this.count_not_closed_brackets('(') >= 0) {
          this.codemirror.setValue(this.query_first_part + suggestion_to_write + ')' + this.query_last_part);
          this.written_suggestion = suggestion_to_write + ')';
        } else {
          this.codemirror.setValue(this.query_first_part + suggestion_to_write + this.query_last_part);
          this.written_suggestion = suggestion_to_write;
          if ((move_outside === false) && (suggestion_to_write[suggestion_to_write.length - 1] === '"' || suggestion_to_write[suggestion_to_write.length - 1] === "'")) {
            ch--;
          }
        }
        this.codemirror.focus();
        return this.codemirror.setCursor({
          line: this.cursor_for_auto_completion.line,
          ch: ch
        });
      } else {
        this.codemirror.setValue(this.query_first_part + suggestion_to_write + this.query_last_part);
        this.written_suggestion = suggestion_to_write;
        if ((move_outside === false) && (suggestion_to_write[suggestion_to_write.length - 1] === '"' || suggestion_to_write[suggestion_to_write.length - 1] === "'")) {
          ch--;
        }
        this.codemirror.focus();
        return this.codemirror.setCursor({
          line: this.cursor_for_auto_completion.line,
          ch: ch
        });
      }
    };

    Container.prototype.select_suggestion = function(event) {
      var suggestion_to_write,
        _this = this;
      suggestion_to_write = this.$(event.target).html();
      this.write_suggestion({
        suggestion_to_write: suggestion_to_write
      });
      this.hide_suggestion();
      return setTimeout(function() {
        _this.handle_keypress();
        return _this.codemirror.focus();
      }, 0);
    };

    Container.prototype.mouseover_suggestion = function(event) {
      return this.highlight_suggestion(event.target.dataset.id);
    };

    Container.prototype.mouseout_suggestion = function(event) {
      return this.hide_description();
    };

    Container.prototype.extend_description = function(fn) {
      var data, database_used, databases_available, description, namespace, namespaces_available, _i, _len, _ref;
      if (fn === 'db(' || fn === 'dbDrop(') {
        description = _.extend({}, this.descriptions[fn]);
        if (databases.length === 0) {
          data = {
            no_database: true
          };
        } else {
          databases_available = databases.models.map(function(database) {
            return database.get('name');
          });
          data = {
            no_database: false,
            databases_available: databases_available
          };
        }
        description.description = this.databases_suggestions_template(data) + description.description;
        this.extra_suggestions = databases_available;
      } else if (fn === 'table(' || fn === 'tableDrop(') {
        database_used = this.extract_database_used();
        description = _.extend({}, this.descriptions[fn]);
        if (database_used.error === false) {
          namespaces_available = [];
          _ref = namespaces.models;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            namespace = _ref[_i];
            if (database_used.db_found === false || namespace.get('database') === database_used.id) {
              namespaces_available.push(namespace.get('name'));
            }
          }
          data = {
            namespaces_available: namespaces_available,
            no_namespace: namespaces_available.length === 0
          };
          if (database_used.name != null) {
            data.database_name = database_used.name;
          }
        } else {
          data = {
            error: database_used.error
          };
        }
        description.description = this.namespaces_suggestions_template(data) + description.description;
        this.extra_suggestions = namespaces_available;
      } else {
        description = this.descriptions[fn];
        this.extra_suggestions = null;
      }
      return description;
    };

    Container.prototype.extract_database_used = function() {
      var arg, char, database, database_test_id, db_name, end_arg_position, last_db_position, query_before_cursor, _i, _j, _len, _len1, _ref, _ref1;
      query_before_cursor = this.codemirror.getRange({
        line: 0,
        ch: 0
      }, this.codemirror.getCursor());
      last_db_position = query_before_cursor.lastIndexOf('.db(');
      if (last_db_position === -1) {
        _ref = databases.models;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          database = _ref[_i];
          if (database.get('name') === 'test') {
            database_test_id = database.get('id');
            break;
          }
        }
        if (database_test_id != null) {
          return {
            db_found: true,
            error: false,
            id: database_test_id,
            name: 'test'
          };
        } else {
          return {
            db_found: false,
            error: true
          };
        }
      } else {
        arg = query_before_cursor.slice(last_db_position + 5);
        char = query_before_cursor.slice(last_db_position + 4, last_db_position + 5);
        end_arg_position = arg.indexOf(char);
        if (end_arg_position === -1) {
          return {
            db_found: false,
            error: true
          };
        }
        db_name = arg.slice(0, end_arg_position);
        _ref1 = databases.models;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          database = _ref1[_j];
          if (database.get('name') === db_name) {
            return {
              db_found: true,
              error: false,
              id: database.get('id'),
              name: db_name
            };
          }
        }
        return {
          db_found: false,
          error: true
        };
      }
    };

    Container.prototype.show_more_results = function(event) {
      var get_result_callback;
      event.preventDefault();
      this.skip_value += this.current_results.length;
      try {
        this.current_results = [];
        this.start_time = new Date();
        this.id_execution++;
        get_result_callback = this.generate_get_result_callback(this.id_execution);
        this.state.cursor.next(get_result_callback);
        return $(window).scrollTop(this.$('.results_container').offset().top);
      } catch (err) {
        this.$('.loading_query_img').css('display', 'none');
        return this.results_view.render_error(this.query, err);
      }
    };

    Container.prototype.execute_query = function() {
      var error;
      this.$('.profiler_enabled').slideUp('fast');
      this.state.cursor_timed_out = false;
      this.state.show_query_warning = false;
      this.raw_query = this.codemirror.getValue();
      this.query = this.clean_query(this.raw_query);
      try {
        this.non_rethinkdb_query = '';
        this.index = 0;
        this.raw_queries = this.separate_queries(this.raw_query);
        this.queries = this.separate_queries(this.query);
        if (this.queries.length === 0) {
          error = this.query_error_template({
            no_query: true
          });
          return this.results_view.render_error(null, error, true);
        } else {
          this.$('.loading_query_img').show();
          return this.execute_portion();
        }
      } catch (err) {
        this.$('.loading_query_img').hide();
        this.results_view.render_error(this.query, err, true);
        return this.save_query({
          query: this.raw_query,
          broken_query: true
        });
      }
    };

    Container.prototype.execute_portion = function() {
      var error, full_query, rdb_global_callback, rdb_query;
      this.state.cursor = null;
      while (this.queries[this.index] != null) {
        full_query = this.non_rethinkdb_query;
        full_query += this.queries[this.index];
        try {
          rdb_query = this.evaluate(full_query);
        } catch (err) {
          this.$('.loading_query_img').hide();
          if (this.queries.length > 1) {
            this.results_view.render_error(this.raw_queries[this.index], err, true);
          } else {
            this.results_view.render_error(null, err, true);
          }
          this.save_query({
            query: this.raw_query,
            broken_query: true
          });
          return false;
        }
        this.index++;
        if (rdb_query instanceof this.TermBaseConstructor) {
          this.skip_value = 0;
          this.start_time = new Date();
          this.current_results = [];
          this.id_execution++;
          rdb_global_callback = this.generate_rdb_global_callback(this.id_execution);
          this.state.last_query_has_profile = this.state.options.profiler;
          rdb_query.private_run({
            connection: this.driver_handler.connection,
            timeFormat: "raw",
            profile: this.state.options.profiler
          }, rdb_global_callback);
          return true;
        } else if (rdb_query instanceof DataExplorerView.DriverHandler) {
          return true;
        } else {
          this.non_rethinkdb_query += this.queries[this.index - 1];
          if (this.index === this.queries.length) {
            this.$('.loading_query_img').hide();
            error = this.query_error_template({
              last_non_query: true
            });
            this.results_view.render_error(this.raw_queries[this.index - 1], error, true);
            this.save_query({
              query: this.raw_query,
              broken_query: true
            });
          }
        }
      }
    };

    Container.prototype.generate_rdb_global_callback = function(id_execution) {
      var rdb_global_callback,
        _this = this;
      rdb_global_callback = function(error, results) {
        var cursor, get_result_callback;
        if (_this.id_execution === id_execution) {
          get_result_callback = _this.generate_get_result_callback(id_execution);
          if (error != null) {
            _this.$('.loading_query_img').hide();
            if (_this.queries.length > 1) {
              _this.results_view.render_error(_this.raw_queries[_this.index - 1], error);
            } else {
              _this.results_view.render_error(null, error);
            }
            _this.save_query({
              query: _this.raw_query,
              broken_query: true
            });
            return false;
          }
          if (((results != null ? results.profile : void 0) != null) && _this.state.last_query_has_profile === true) {
            cursor = results.value;
            _this.profile = results.profile;
            _this.state.profile = _this.profile;
          } else {
            cursor = results;
            _this.profile = null;
            _this.state.profile = _this.profile;
          }
          if (_this.index === _this.queries.length) {
            if (cursor != null) {
              _this.state.cursor = _this.cursor;
            }
            if ((cursor != null ? cursor.hasNext : void 0) != null) {
              _this.cursor = cursor;
              if (cursor.hasNext() === true) {
                return _this.cursor.next(get_result_callback);
              } else {
                return get_result_callback();
              }
            } else {
              _this.$('.loading_query_img').hide();
              _this.current_results = cursor;
              _this.state.query = _this.query;
              _this.state.results = _this.current_results;
              _this.state.metadata = {
                limit_value: Object.prototype.toString.call(_this.results) === '[object Array]' ? _this.current_results.length : 1,
                skip_value: _this.skip_value,
                execution_time: new Date() - _this.start_time,
                query: _this.query,
                has_more_data: false
              };
              _this.results_view.render_result({
                results: _this.current_results,
                metadata: _this.state.metadata,
                profile: _this.profile
              });
              return _this.save_query({
                query: _this.raw_query,
                broken_query: false
              });
            }
          } else {
            return _this.execute_portion();
          }
        }
      };
      return rdb_global_callback;
    };

    Container.prototype.generate_get_result_callback = function(id_execution) {
      var get_result_callback,
        _this = this;
      return get_result_callback = function(error, data) {
        var _ref;
        if (_this.id_execution === id_execution) {
          if (error != null) {
            if (_this.queries.length > 1) {
              _this.results_view.render_error(_this.query, error);
            } else {
              _this.results_view.render_error(null, error);
            }
            return false;
          }
          if (data !== void 0) {
            _this.current_results.push(data);
            if (_this.current_results.length < _this.limit && _this.cursor.hasNext() === true) {
              _this.cursor.next(get_result_callback);
              return true;
            }
          }
          _this.$('.loading_query_img').hide();
          _this.state.cursor = _this.cursor;
          _this.state.query = _this.query;
          _this.state.results = _this.current_results;
          _this.state.metadata = {
            limit_value: ((_ref = _this.current_results) != null ? _ref.length : void 0) != null ? _this.current_results.length : 1,
            skip_value: _this.skip_value,
            execution_time: new Date() - _this.start_time,
            query: _this.query,
            has_more_data: _this.cursor.hasNext()
          };
          _this.results_view.render_result({
            results: _this.current_results,
            metadata: _this.state.metadata,
            profile: _this.profile
          });
          return _this.save_query({
            query: _this.raw_query,
            broken_query: false
          });
        }
      };
    };

    Container.prototype.evaluate = function(query) {
      "use strict";
      return eval(query);
    };

    Container.prototype.clean_query = function(query) {
      var char, i, is_parsing_string, result_inline_comment, result_multiple_line_comment, result_query, start, string_delimiter, to_skip, _i, _len;
      is_parsing_string = false;
      start = 0;
      result_query = '';
      for (i = _i = 0, _len = query.length; _i < _len; i = ++_i) {
        char = query[i];
        if (to_skip > 0) {
          to_skip--;
          continue;
        }
        if (is_parsing_string === true) {
          if (char === string_delimiter && (query[i - 1] != null) && query[i - 1] !== '\\') {
            result_query += query.slice(start, i + 1).replace(/\n/g, '\\\\n');
            start = i + 1;
            is_parsing_string = false;
            continue;
          }
        } else {
          if (char === '\'' || char === '"') {
            result_query += query.slice(start, i).replace(/\n/g, '');
            start = i;
            is_parsing_string = true;
            string_delimiter = char;
            continue;
          }
          result_inline_comment = this.regex.inline_comment.exec(query.slice(i));
          if (result_inline_comment != null) {
            result_query += query.slice(start, i).replace(/\n/g, '');
            start = i;
            to_skip = result_inline_comment[0].length - 1;
            start += result_inline_comment[0].length;
            continue;
          }
          result_multiple_line_comment = this.regex.multiple_line_comment.exec(query.slice(i));
          if (result_multiple_line_comment != null) {
            result_query += query.slice(start, i).replace(/\n/g, '');
            start = i;
            to_skip = result_multiple_line_comment[0].length - 1;
            start += result_multiple_line_comment[0].length;
            continue;
          }
        }
      }
      if (is_parsing_string) {
        result_query += query.slice(start, i).replace(/\n/g, '\\\\n');
      } else {
        result_query += query.slice(start, i).replace(/\n/g, '');
      }
      return result_query;
    };

    Container.prototype.separate_queries = function(query) {
      var char, i, is_parsing_string, last_query, position, queries, result_inline_comment, result_multiple_line_comment, stack, start, string_delimiter, to_skip, _i, _len;
      queries = [];
      is_parsing_string = false;
      stack = [];
      start = 0;
      position = {
        char: 0,
        line: 1
      };
      for (i = _i = 0, _len = query.length; _i < _len; i = ++_i) {
        char = query[i];
        if (char === '\n') {
          position.line++;
          position.char = 0;
        } else {
          position.char++;
        }
        if (to_skip > 0) {
          to_skip--;
          continue;
        }
        if (is_parsing_string === true) {
          if (char === string_delimiter && (query[i - 1] != null) && query[i - 1] !== '\\') {
            is_parsing_string = false;
            continue;
          }
        } else {
          if (char === '\'' || char === '"') {
            is_parsing_string = true;
            string_delimiter = char;
            continue;
          }
          result_inline_comment = this.regex.inline_comment.exec(query.slice(i));
          if (result_inline_comment != null) {
            to_skip = result_inline_comment[0].length - 1;
            continue;
          }
          result_multiple_line_comment = this.regex.multiple_line_comment.exec(query.slice(i));
          if (result_multiple_line_comment != null) {
            to_skip = result_multiple_line_comment[0].length - 1;
            continue;
          }
          if (char in this.stop_char.opening) {
            stack.push(char);
          } else if (char in this.stop_char.closing) {
            if (stack[stack.length - 1] !== this.stop_char.closing[char]) {
              throw this.query_error_template({
                syntax_error: true,
                bracket: char,
                line: position.line,
                position: position.char
              });
            } else {
              stack.pop();
            }
          } else if (char === ';' && stack.length === 0) {
            queries.push(query.slice(start, i + 1));
            start = i + 1;
          }
        }
      }
      if (start < query.length - 1) {
        last_query = query.slice(start);
        if (this.regex.white.test(last_query) === false) {
          queries.push(last_query);
        }
      }
      return queries;
    };

    Container.prototype.clear_query = function() {
      this.codemirror.setValue('');
      return this.codemirror.focus();
    };

    Container.prototype.success_on_connect = function(connection) {
      this.connection = connection;
      this.results_view.cursor_timed_out();
      if (this.reconnecting === true) {
        this.$('#user-alert-space').hide();
        this.$('#user-alert-space').html(this.alert_reconnection_success_template());
        this.$('#user-alert-space').slideDown('fast');
      }
      this.reconnecting = false;
      return this.driver_connected = 'connected';
    };

    Container.prototype.error_on_connect = function(error) {
      if (/^(Unexpected token)/.test(error.message)) {
        this.$('.loading_query_img').hide();
        this.results_view.render_error(null, error);
        return this.save_query({
          query: this.raw_query,
          broken_query: true
        });
      } else {
        this.results_view.cursor_timed_out();
        this.$('#user-alert-space').hide();
        this.$('#user-alert-space').html(this.alert_connection_fail_template({}));
        this.$('#user-alert-space').slideDown('fast');
        this.reconnecting = false;
        return this.driver_connected = 'error';
      }
    };

    Container.prototype.reconnect = function(event) {
      this.reconnecting = true;
      event.preventDefault();
      return this.driver_handler.connect();
    };

    Container.prototype.handle_gutter_click = function(editor, line) {
      var end, start;
      start = {
        line: line,
        ch: 0
      };
      end = {
        line: line,
        ch: this.codemirror.getLine(line).length
      };
      return this.codemirror.setSelection(start, end);
    };

    Container.prototype.toggle_size = function() {
      if (this.displaying_full_view === true) {
        this.display_normal();
        $(window).off('resize', this.display_full);
        this.displaying_full_view = false;
      } else {
        this.display_full();
        $(window).on('resize', this.display_full);
        this.displaying_full_view = true;
      }
      return this.results_view.set_scrollbar();
    };

    Container.prototype.display_normal = function() {
      $('#cluster').addClass('container');
      $('#cluster').removeClass('cluster_with_margin');
      this.$('.wrapper_scrollbar').css('width', '888px');
      this.$('.option_icon').removeClass('fullscreen_exit');
      return this.$('.option_icon').addClass('fullscreen');
    };

    Container.prototype.display_full = function() {
      $('#cluster').removeClass('container');
      $('#cluster').addClass('cluster_with_margin');
      this.$('.wrapper_scrollbar').css('width', ($(window).width() - 92) + 'px');
      this.$('.option_icon').removeClass('fullscreen');
      return this.$('.option_icon').addClass('fullscreen_exit');
    };

    Container.prototype.destroy = function() {
      this.results_view.destroy();
      this.history_view.destroy();
      this.driver_handler.destroy();
      this.display_normal();
      $(window).off('resize', this.display_full);
      $(document).unbind('mousemove', this.handle_mousemove);
      $(document).unbind('mouseup', this.handle_mouseup);
      return clearTimeout(this.timeout_driver_connect);
    };

    return Container;

  })(Backbone.View);
  this.SharedResultView = (function(_super) {

    __extends(SharedResultView, _super);

    function SharedResultView() {
      this.date_to_string = __bind(this.date_to_string, this);

      this.set_scrollbar = __bind(this.set_scrollbar, this);

      this.join_table = __bind(this.join_table, this);

      this.compute_data_for_type = __bind(this.compute_data_for_type, this);

      this.json_to_table_get_td_value = __bind(this.json_to_table_get_td_value, this);

      this.json_to_table_get_values = __bind(this.json_to_table_get_values, this);

      this.json_to_table_get_attr = __bind(this.json_to_table_get_attr, this);

      this.json_to_tree = __bind(this.json_to_tree, this);

      this.get_all_attr = __bind(this.get_all_attr, this);

      this.json_to_table = __bind(this.json_to_table, this);

      this.order_keys = __bind(this.order_keys, this);

      this.compute_occurrence = __bind(this.compute_occurrence, this);

      this.build_map_keys = __bind(this.build_map_keys, this);

      this.json_to_node = __bind(this.json_to_node, this);

      this.set_view = __bind(this.set_view, this);

      this.show_raw = __bind(this.show_raw, this);

      this.show_table = __bind(this.show_table, this);

      this.show_profile = __bind(this.show_profile, this);

      this.show_tree = __bind(this.show_tree, this);

      this.expand_tree_in_table = __bind(this.expand_tree_in_table, this);

      this.handle_mouseup = __bind(this.handle_mouseup, this);

      this.resize_column = __bind(this.resize_column, this);

      this.handle_mousemove = __bind(this.handle_mousemove, this);

      this.handle_mousedown = __bind(this.handle_mousedown, this);

      this.toggle_collapse = __bind(this.toggle_collapse, this);

      this.expand_raw_textarea = __bind(this.expand_raw_textarea, this);
      return SharedResultView.__super__.constructor.apply(this, arguments);
    }

    SharedResultView.prototype.template_json_tree = {
      'container': Handlebars.templates['dataexplorer_result_json_tree_container-template'],
      'span': Handlebars.templates['dataexplorer_result_json_tree_span-template'],
      'span_with_quotes': Handlebars.templates['dataexplorer_result_json_tree_span_with_quotes-template'],
      'url': Handlebars.templates['dataexplorer_result_json_tree_url-template'],
      'email': Handlebars.templates['dataexplorer_result_json_tree_email-template'],
      'object': Handlebars.templates['dataexplorer_result_json_tree_object-template'],
      'array': Handlebars.templates['dataexplorer_result_json_tree_array-template']
    };

    SharedResultView.prototype.template_json_table = {
      'container': Handlebars.templates['dataexplorer_result_json_table_container-template'],
      'tr_attr': Handlebars.templates['dataexplorer_result_json_table_tr_attr-template'],
      'td_attr': Handlebars.templates['dataexplorer_result_json_table_td_attr-template'],
      'tr_value': Handlebars.templates['dataexplorer_result_json_table_tr_value-template'],
      'td_value': Handlebars.templates['dataexplorer_result_json_table_td_value-template'],
      'td_value_content': Handlebars.templates['dataexplorer_result_json_table_td_value_content-template'],
      'data_inline': Handlebars.templates['dataexplorer_result_json_table_data_inline-template']
    };

    SharedResultView.prototype.default_size_column = 310;

    SharedResultView.prototype.mouse_down = false;

    SharedResultView.prototype.events = function() {
      return {
        'click .link_to_profile_view': 'show_profile',
        'click .link_to_tree_view': 'show_tree',
        'click .link_to_table_view': 'show_table',
        'click .link_to_raw_view': 'show_raw',
        'click .jt_arrow': 'toggle_collapse',
        'mousedown .click_detector': 'handle_mousedown',
        'click .jta_arrow_h': 'expand_tree_in_table'
      };
    };

    SharedResultView.prototype.expand_raw_textarea = function() {
      var height;
      if ($('.raw_view_textarea').length > 0) {
        height = $('.raw_view_textarea')[0].scrollHeight;
        return $('.raw_view_textarea').height(height);
      }
    };

    SharedResultView.prototype.toggle_collapse = function(event) {
      this.$(event.target).nextAll('.jt_collapsible').toggleClass('jt_collapsed');
      this.$(event.target).nextAll('.jt_points').toggleClass('jt_points_collapsed');
      this.$(event.target).nextAll('.jt_b').toggleClass('jt_b_collapsed');
      this.$(event.target).toggleClass('jt_arrow_hidden');
      return this.set_scrollbar();
    };

    SharedResultView.prototype.handle_mousedown = function(event) {
      var _ref;
      if ((event != null ? (_ref = event.target) != null ? _ref.className : void 0 : void 0) === 'click_detector') {
        this.col_resizing = this.$(event.target).parent().data('col');
        this.start_width = this.$(event.target).parent().width();
        this.start_x = event.pageX;
        this.mouse_down = true;
        return $('body').toggleClass('resizing', true);
      }
    };

    SharedResultView.prototype.handle_mousemove = function(event) {
      if (this.mouse_down) {
        this.container.state.last_columns_size[this.col_resizing] = Math.max(5, this.start_width - this.start_x + event.pageX);
        return this.resize_column(this.col_resizing, this.container.state.last_columns_size[this.col_resizing]);
      }
    };

    SharedResultView.prototype.resize_column = function(col, size) {
      this.$('.col-' + col).css('max-width', size);
      this.$('.value-' + col).css('max-width', size - 20);
      this.$('.col-' + col).css('width', size);
      this.$('.value-' + col).css('width', size - 20);
      if (size < 20) {
        this.$('.value-' + col).css('padding-left', (size - 5) + 'px');
        return this.$('.value-' + col).css('visibility', 'hidden');
      } else {
        this.$('.value-' + col).css('padding-left', '15px');
        return this.$('.value-' + col).css('visibility', 'visible');
      }
    };

    SharedResultView.prototype.handle_mouseup = function(event) {
      if (this.mouse_down === true) {
        this.mouse_down = false;
        $('body').toggleClass('resizing', false);
        return this.set_scrollbar();
      }
    };

    SharedResultView.prototype.expand_tree_in_table = function(event) {
      var classname_to_change, data, dom_element, result;
      dom_element = this.$(event.target).parent();
      this.$(event.target).remove();
      data = dom_element.data('json_data');
      result = this.json_to_tree(data);
      dom_element.html(result);
      classname_to_change = dom_element.parent().attr('class').split(' ')[0];
      $('.' + classname_to_change).css('max-width', 'none');
      classname_to_change = dom_element.parent().parent().attr('class');
      $('.' + classname_to_change).css('max-width', 'none');
      dom_element.css('max-width', 'none');
      return this.set_scrollbar();
    };

    SharedResultView.prototype.show_tree = function(event) {
      event.preventDefault();
      return this.set_view('tree');
    };

    SharedResultView.prototype.show_profile = function(event) {
      event.preventDefault();
      return this.set_view('profile');
    };

    SharedResultView.prototype.show_table = function(event) {
      event.preventDefault();
      return this.set_view('table');
    };

    SharedResultView.prototype.show_raw = function(event) {
      event.preventDefault();
      return this.set_view('raw');
    };

    SharedResultView.prototype.set_view = function(view) {
      this.view = view;
      this.container.state.view = view;
      return this.render_result();
    };

    SharedResultView.prototype.json_to_node = function(value) {
      var data, element, key, last_key, output, sub_keys, sub_values, value_type, _i, _j, _len, _len1;
      value_type = typeof value;
      output = '';
      if (value === null) {
        return this.template_json_tree.span({
          classname: 'jt_null',
          value: 'null'
        });
      } else if (Object.prototype.toString.call(value) === '[object Array]') {
        if (value.length === 0) {
          return '[ ]';
        } else {
          sub_values = [];
          for (_i = 0, _len = value.length; _i < _len; _i++) {
            element = value[_i];
            sub_values.push({
              value: this.json_to_node(element)
            });
            if (typeof element === 'string' && (/^(http|https):\/\/[^\s]+$/i.test(element) || /^[a-z0-9._-]+@[a-z0-9]+.[a-z0-9._-]{2,4}/i.test(element))) {
              sub_values[sub_values.length - 1]['no_comma'] = true;
            }
          }
          sub_values[sub_values.length - 1]['no_comma'] = true;
          return this.template_json_tree.array({
            values: sub_values
          });
        }
      } else if (value_type === 'object' && value.$reql_type$ === 'TIME' && (value.epoch_time != null)) {
        return this.template_json_tree.span({
          classname: 'jt_date',
          value: this.date_to_string(value)
        });
      } else if (value_type === 'object') {
        sub_keys = [];
        for (key in value) {
          sub_keys.push(key);
        }
        sub_keys.sort();
        sub_values = [];
        for (_j = 0, _len1 = sub_keys.length; _j < _len1; _j++) {
          key = sub_keys[_j];
          last_key = key;
          sub_values.push({
            key: key,
            value: this.json_to_node(value[key])
          });
          if (typeof value[key] === 'string' && (/^(http|https):\/\/[^\s]+$/i.test(value[key]) || /^[a-z0-9._-]+@[a-z0-9]+.[a-z0-9._-]{2,4}/i.test(value[key]))) {
            sub_values[sub_values.length - 1]['no_comma'] = true;
          }
        }
        if (sub_values.length !== 0) {
          sub_values[sub_values.length - 1]['no_comma'] = true;
        }
        data = {
          no_values: false,
          values: sub_values
        };
        if (sub_values.length === 0) {
          data.no_value = true;
        }
        return this.template_json_tree.object(data);
      } else if (value_type === 'number') {
        return this.template_json_tree.span({
          classname: 'jt_num',
          value: value
        });
      } else if (value_type === 'string') {
        if (/^(http|https):\/\/[^\s]+$/i.test(value)) {
          return this.template_json_tree.url({
            url: value
          });
        } else if (/^[a-z0-9]+@[a-z0-9]+.[a-z0-9]{2,4}/i.test(value)) {
          return this.template_json_tree.email({
            email: value
          });
        } else {
          return this.template_json_tree.span_with_quotes({
            classname: 'jt_string',
            value: value
          });
        }
      } else if (value_type === 'boolean') {
        return this.template_json_tree.span({
          classname: 'jt_bool',
          value: value ? 'true' : 'false'
        });
      }
    };

    /*
            keys =
                primitive_value_count: <int>
                object:
                    key_1: <keys>
                    key_2: <keys>
    */


    SharedResultView.prototype.build_map_keys = function(args) {
      var key, keys_count, result, row, _results;
      keys_count = args.keys_count;
      result = args.result;
      if (jQuery.isPlainObject(result)) {
        if (result.$reql_type$ === 'TIME' && (result.epoch_time != null)) {
          return keys_count.primitive_value_count++;
        } else {
          _results = [];
          for (key in result) {
            row = result[key];
            if (!(keys_count['object'] != null)) {
              keys_count['object'] = {};
            }
            if (!(keys_count['object'][key] != null)) {
              keys_count['object'][key] = {
                primitive_value_count: 0
              };
            }
            _results.push(this.build_map_keys({
              keys_count: keys_count['object'][key],
              result: row
            }));
          }
          return _results;
        }
      } else {
        return keys_count.primitive_value_count++;
      }
    };

    SharedResultView.prototype.compute_occurrence = function(keys_count) {
      var count_key, count_occurrence, key, row, _ref;
      if (!(keys_count['object'] != null)) {
        return keys_count.occurrence = keys_count.primitive_value_count;
      } else {
        count_key = keys_count.primitive_value_count > 0 ? 1 : 0;
        count_occurrence = keys_count.primitive_value_count;
        _ref = keys_count['object'];
        for (key in _ref) {
          row = _ref[key];
          count_key++;
          this.compute_occurrence(row);
          count_occurrence += row.occurrence;
        }
        return keys_count.occurrence = count_occurrence / count_key;
      }
    };

    SharedResultView.prototype.order_keys = function(keys) {
      var copy_keys, key, value, _ref;
      copy_keys = [];
      if (keys.object != null) {
        _ref = keys.object;
        for (key in _ref) {
          value = _ref[key];
          if (jQuery.isPlainObject(value)) {
            this.order_keys(value);
          }
          copy_keys.push({
            key: key,
            value: value.occurrence
          });
        }
        copy_keys.sort(function(a, b) {
          if (b.value - a.value) {
            return b.value - a.value;
          } else {
            if (a.key > b.key) {
              return 1;
            } else {
              return -1;
            }
          }
        });
      }
      keys.sorted_keys = _.map(copy_keys, function(d) {
        return d.key;
      });
      if (keys.primitive_value_count > 0) {
        return keys.sorted_keys.unshift(this.primitive_key);
      }
    };

    SharedResultView.prototype.json_to_table = function(result, primary_key, can_sort, indexes) {
      var flatten_attr, index, keys_count, result_entry, value, _i, _j, _len, _len1;
      if (!(result.constructor != null) || result.constructor !== Array) {
        result = [result];
      }
      keys_count = {
        primitive_value_count: 0
      };
      for (_i = 0, _len = result.length; _i < _len; _i++) {
        result_entry = result[_i];
        this.build_map_keys({
          keys_count: keys_count,
          result: result_entry
        });
      }
      this.compute_occurrence(keys_count);
      this.order_keys(keys_count);
      flatten_attr = [];
      this.get_all_attr({
        keys_count: keys_count,
        attr: flatten_attr,
        prefix: [],
        prefix_str: ''
      });
      for (index = _j = 0, _len1 = flatten_attr.length; _j < _len1; index = ++_j) {
        value = flatten_attr[index];
        value.col = index;
      }
      return {
        flatten_attr: flatten_attr,
        result: result
      };
    };

    SharedResultView.prototype.get_all_attr = function(args) {
      var attr, key, keys_count, new_prefix, new_prefix_str, prefix, prefix_str, _i, _len, _ref, _results;
      keys_count = args.keys_count;
      attr = args.attr;
      prefix = args.prefix;
      prefix_str = args.prefix_str;
      _ref = keys_count.sorted_keys;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        if (key === this.primitive_key) {
          new_prefix_str = prefix_str;
          if (new_prefix_str.length > 0) {
            new_prefix_str = new_prefix_str.slice(0, -1);
          }
          _results.push(attr.push({
            prefix: prefix,
            prefix_str: new_prefix_str,
            is_primitive: true
          }));
        } else {
          if (keys_count['object'][key]['object'] != null) {
            new_prefix = DataUtils.deep_copy(prefix);
            new_prefix.push(key);
            _results.push(this.get_all_attr({
              keys_count: keys_count.object[key],
              attr: attr,
              prefix: new_prefix,
              prefix_str: (prefix_str != null ? prefix_str : '') + key + '.'
            }));
          } else {
            _results.push(attr.push({
              prefix: prefix,
              prefix_str: prefix_str,
              key: key
            }));
          }
        }
      }
      return _results;
    };

    SharedResultView.prototype.json_to_tree = function(result) {
      return this.template_json_tree.container({
        tree: this.json_to_node(result)
      });
    };

    SharedResultView.prototype.json_to_table_get_attr = function(flatten_attr) {
      return this.template_json_table.tr_attr({
        attr: flatten_attr
      });
    };

    SharedResultView.prototype.json_to_table_get_values = function(args) {
      var attr_obj, col, document_list, flatten_attr, i, key, new_document, prefix, result, single_result, value, _i, _j, _k, _len, _len1, _len2, _ref;
      result = args.result;
      flatten_attr = args.flatten_attr;
      document_list = [];
      for (i = _i = 0, _len = result.length; _i < _len; i = ++_i) {
        single_result = result[i];
        new_document = {
          cells: []
        };
        for (col = _j = 0, _len1 = flatten_attr.length; _j < _len1; col = ++_j) {
          attr_obj = flatten_attr[col];
          key = attr_obj.key;
          value = single_result;
          _ref = attr_obj.prefix;
          for (_k = 0, _len2 = _ref.length; _k < _len2; _k++) {
            prefix = _ref[_k];
            value = value != null ? value[prefix] : void 0;
          }
          if (attr_obj.is_primitive !== true) {
            if (value != null) {
              value = value[key];
            } else {
              value = void 0;
            }
          }
          new_document.cells.push(this.json_to_table_get_td_value(value, col));
        }
        this.tag_record(new_document, i);
        document_list.push(new_document);
      }
      return this.template_json_table.tr_value({
        document: document_list
      });
    };

    SharedResultView.prototype.json_to_table_get_td_value = function(value, col) {
      var data;
      data = this.compute_data_for_type(value, col);
      return this.template_json_table.td_value({
        col: col,
        cell_content: this.template_json_table.td_value_content(data)
      });
    };

    SharedResultView.prototype.compute_data_for_type = function(value, col) {
      var data, value_type;
      data = {
        value: value,
        class_value: 'value-' + col
      };
      value_type = typeof value;
      if (value === null) {
        data['value'] = 'null';
        data['classname'] = 'jta_null';
      } else if (value === void 0) {
        data['value'] = 'undefined';
        data['classname'] = 'jta_undefined';
      } else if ((value.constructor != null) && value.constructor === Array) {
        if (value.length === 0) {
          data['value'] = '[ ]';
          data['classname'] = 'empty array';
        } else {
          data['value'] = '[ ... ]';
          data['data_to_expand'] = JSON.stringify(value);
        }
      } else if (value_type === 'object' && value.$reql_type$ === 'TIME' && (value.epoch_time != null)) {
        data['value'] = this.date_to_string(value);
        data['classname'] = 'jta_date';
      } else if (value_type === 'object') {
        data['value'] = '{ ... }';
        data['is_object'] = true;
      } else if (value_type === 'number') {
        data['classname'] = 'jta_num';
      } else if (value_type === 'string') {
        if (/^(http|https):\/\/[^\s]+$/i.test(value)) {
          data['classname'] = 'jta_url';
        } else if (/^[a-z0-9]+@[a-z0-9]+.[a-z0-9]{2,4}/i.test(value)) {
          data['classname'] = 'jta_email';
        } else {
          data['classname'] = 'jta_string';
        }
      } else if (value_type === 'boolean') {
        data['classname'] = 'jta_bool';
        data.value = value === true ? 'true' : 'false';
      }
      return data;
    };

    SharedResultView.prototype.join_table = function(data) {
      var data_cell, i, result, value, _i, _len;
      result = '';
      for (i = _i = 0, _len = data.length; _i < _len; i = ++_i) {
        value = data[i];
        data_cell = this.compute_data_for_type(value, 'float');
        data_cell['is_inline'] = true;
        if (i !== data.length - 1) {
          data_cell['need_comma'] = true;
        }
        result += this.template_json_table.data_inline(data_cell);
      }
      return result;
    };

    SharedResultView.prototype.set_scrollbar = function() {
      var content_container, content_name, position_scrollbar, that, width_value;
      if (this.view === 'table') {
        content_name = '.json_table';
        content_container = '.table_view_container';
      } else if (this.view === 'tree') {
        content_name = '.json_tree';
        content_container = '.tree_view_container';
      } else if (this.view === 'profile') {
        content_name = '.json_tree';
        content_container = '.profile_view_container';
      } else if (this.view === 'raw') {
        this.$('.wrapper_scrollbar').hide();
        return;
      }
      width_value = this.$(content_name).innerWidth();
      if (width_value < this.$(content_container).width()) {
        this.$('.wrapper_scrollbar').hide();
        return $(window).unbind('scroll');
      } else {
        this.$('.wrapper_scrollbar').show();
        this.$('.scrollbar_fake_content').width(width_value);
        $(".wrapper_scrollbar").scroll(function() {
          return $(content_container).scrollLeft($(".wrapper_scrollbar").scrollLeft());
        });
        $(content_container).scroll(function() {
          return $(".wrapper_scrollbar").scrollLeft($(content_container).scrollLeft());
        });
        position_scrollbar = function() {
          if ($(content_container).offset() != null) {
            if ($(window).scrollTop() + $(window).height() < $(content_container).offset().top + 20) {
              return that.$('.wrapper_scrollbar').hide();
            } else if ($(window).scrollTop() + $(window).height() < $(content_container).offset().top + $(content_container).height()) {
              that.$('.wrapper_scrollbar').show();
              that.$('.wrapper_scrollbar').css('overflow', 'auto');
              return that.$('.wrapper_scrollbar').css('margin-bottom', '0px');
            } else {
              return that.$('.wrapper_scrollbar').css('overflow', 'hidden');
            }
          }
        };
        that = this;
        position_scrollbar();
        $(window).scroll(function() {
          return position_scrollbar();
        });
        return $(window).resize(function() {
          return position_scrollbar();
        });
      }
    };

    SharedResultView.prototype.date_to_string = function(date) {
      var raw_date_str, sign, timezone, timezone_array, timezone_int;
      if (date.timezone != null) {
        timezone = date.timezone;
        timezone_array = date.timezone.split(':');
        sign = timezone_array[0][0];
        timezone_array[0] = timezone_array[0].slice(1);
        timezone_int = (parseInt(timezone_array[0]) * 60 + parseInt(timezone_array[1])) * 60;
        if (sign === '-') {
          timezone_int = -1 * timezone_int;
        }
        timezone_int += (new Date()).getTimezoneOffset() * 60;
      } else {
        timezone = '+00:00';
        timezone_int = (new Date()).getTimezoneOffset() * 60;
      }
      raw_date_str = (new Date((date.epoch_time + timezone_int) * 1000)).toString();
      return raw_date_str.slice(0, raw_date_str.indexOf('GMT') + 3) + timezone;
    };

    return SharedResultView;

  })(Backbone.View);
  this.ResultView = (function(_super) {

    __extends(ResultView, _super);

    function ResultView() {
      this.destroy = __bind(this.destroy, this);

      this.render_default = __bind(this.render_default, this);

      this.render = __bind(this.render, this);

      this.cursor_timed_out = __bind(this.cursor_timed_out, this);

      this.render_result = __bind(this.render_result, this);

      this.tag_record = __bind(this.tag_record, this);

      this.json_to_table = __bind(this.json_to_table, this);

      this.render_error = __bind(this.render_error, this);

      this.activate_profiler = __bind(this.activate_profiler, this);

      this.initialize = __bind(this.initialize, this);
      return ResultView.__super__.constructor.apply(this, arguments);
    }

    ResultView.prototype.className = 'result_view';

    ResultView.prototype.template = Handlebars.templates['dataexplorer_result_container-template'];

    ResultView.prototype.metadata_template = Handlebars.templates['dataexplorer-metadata-template'];

    ResultView.prototype.option_template = Handlebars.templates['dataexplorer-option_page-template'];

    ResultView.prototype.error_template = Handlebars.templates['dataexplorer-error-template'];

    ResultView.prototype.template_no_result = Handlebars.templates['dataexplorer_result_empty-template'];

    ResultView.prototype.cursor_timed_out_template = Handlebars.templates['dataexplorer-cursor_timed_out-template'];

    ResultView.prototype.no_profile_template = Handlebars.templates['dataexplorer-no_profile-template'];

    ResultView.prototype.profile_header_template = Handlebars.templates['dataexplorer-profiler_header-template'];

    ResultView.prototype.primitive_key = '_-primitive value-_--';

    ResultView.prototype.events = function() {
      return _.extend(ResultView.__super__.events.apply(this, arguments), {
        'click .activate_profiler': 'activate_profiler'
      });
    };

    ResultView.prototype.current_result = [];

    ResultView.prototype.initialize = function(args) {
      this.container = args.container;
      this.limit = args.limit;
      this.skip = 0;
      if (args.view != null) {
        this.view = args.view;
      } else {
        this.view = 'tree';
      }
      this.last_keys = this.container.state.last_keys;
      this.last_columns_size = this.container.state.last_columns_size;
      ZeroClipboard.setDefaults({
        moviePath: 'js/ZeroClipboard.swf',
        forceHandCursor: true
      });
      return this.clip = new ZeroClipboard();
    };

    ResultView.prototype.activate_profiler = function(event) {
      var _this = this;
      event.preventDefault();
      if (this.container.options_view.state === 'hidden') {
        return this.container.toggle_options({
          cb: function() {
            return setTimeout(function() {
              if (_this.container.state.options.profiler === false) {
                _this.container.options_view.$('.option_description[data-option="profiler"]').click();
              }
              _this.container.options_view.$('.profiler_enabled').show();
              return _this.container.options_view.$('.profiler_enabled').css('visibility', 'visible');
            }, 100);
          }
        });
      } else {
        if (this.container.state.options.profiler === false) {
          this.container.options_view.$('.option_description[data-option="profiler"]').click();
        }
        this.container.options_view.$('.profiler_enabled').hide();
        this.container.options_view.$('.profiler_enabled').css('visibility', 'visible');
        return this.container.options_view.$('.profiler_enabled').slideDown('fast');
      }
    };

    ResultView.prototype.render_error = function(query, err, js_error) {
      this.$el.html(this.error_template({
        query: query,
        error: err.toString().replace(/^(\s*)/, ''),
        js_error: js_error === true
      }));
      return this;
    };

    ResultView.prototype.json_to_table = function(result) {
      var flatten_attr, _ref;
      _ref = ResultView.__super__.json_to_table.call(this, result), flatten_attr = _ref.flatten_attr, result = _ref.result;
      this.last_keys = flatten_attr.map(function(attr, i) {
        if (attr.prefix_str !== '') {
          return attr.prefix_str + attr.key;
        }
        return attr.key;
      });
      this.container.state.last_keys = this.last_keys;
      return this.template_json_table.container({
        table_attr: this.json_to_table_get_attr(flatten_attr),
        table_data: this.json_to_table_get_values({
          result: result,
          flatten_attr: flatten_attr
        })
      });
    };

    ResultView.prototype.tag_record = function(doc, i) {
      return doc.record = this.metadata.skip_value + i;
    };

    ResultView.prototype.render_result = function(args) {
      var col, column, current_size, expandable_columns, extra_size_table, index, keys, max_size, num_results, previous_keys, real_size, same_keys, value, _i, _j, _k, _len, _len1, _ref, _ref1, _ref2, _ref3, _ref4;
      if ((args != null) && args.results !== void 0) {
        this.results = args.results;
        this.results_array = null;
      }
      if ((args != null) && args.profile !== void 0) {
        this.profile = args.profile;
      }
      if ((args != null ? args.metadata : void 0) != null) {
        this.metadata = args.metadata;
      }
      if ((args != null ? (_ref = args.metadata) != null ? _ref.skip_value : void 0 : void 0) != null) {
        this.container.state.start_record = args.metadata.skip_value;
        if (args.metadata.execution_time != null) {
          this.metadata.execution_time_pretty = this.prettify_duration(args.metadata.execution_time);
        }
      }
      num_results = this.metadata.skip_value;
      if (this.metadata.has_more_data !== true) {
        if (Object.prototype.toString.call(this.results) === '[object Array]') {
          num_results += this.results.length;
        } else {
          num_results += 1;
        }
      }
      this.$el.html(this.template(_.extend(this.metadata, {
        show_query_warning: args != null ? args.show_query_warning : void 0,
        show_more_data: this.metadata.has_more_data === true && this.container.state.cursor_timed_out === false,
        cursor_timed_out_template: (this.metadata.has_more_data === true && this.container.state.cursor_timed_out === true ? this.cursor_timed_out_template() : void 0),
        execution_time_pretty: this.metadata.execution_time_pretty,
        no_results: this.metadata.has_more_data !== true && ((_ref1 = this.results) != null ? _ref1.length : void 0) === 0 && this.metadata.skip_value === 0,
        num_results: num_results
      })));
      this.$('.copy_profile').attr('data-clipboard-text', JSON.stringify(this.profile, null, 2));
      if (this.view === 'profile') {
        this.$('.more_results').hide();
        this.$('.profile_summary').show();
      } else {
        this.$('.more_results').show();
        this.$('.profile_summary').hide();
        this.$('.copy_profile').hide();
      }
      switch (this.view) {
        case 'profile':
          if (this.profile === null) {
            this.$('.profile_container').html(this.no_profile_template());
            this.$('.copy_profile').hide();
          } else {
            this.$('.profile_container').html(this.json_to_tree(this.profile));
            this.$('.copy_profile').show();
            this.$('.profile_summary_container').html(this.profile_header_template({
              total_duration: this.metadata.execution_time_pretty,
              server_duration: this.prettify_duration(this.compute_total_duration(this.profile)),
              num_shard_accesses: this.compute_num_shard_accesses(this.profile)
            }));
            this.clip.glue($('button.copy_profile'));
          }
          this.$('.results').hide();
          this.$('.profile_view_container').show();
          this.$('.link_to_profile_view').addClass('active');
          this.$('.link_to_profile_view').parent().addClass('active');
          break;
        case 'tree':
          this.$('.json_tree_container').html(this.json_to_tree(this.results));
          this.$('.results').hide();
          this.$('.tree_view_container').show();
          this.$('.link_to_tree_view').addClass('active');
          this.$('.link_to_tree_view').parent().addClass('active');
          break;
        case 'table':
          previous_keys = this.container.state.last_keys;
          if (Object.prototype.toString.call(this.results) === '[object Array]') {
            this.$('.table_view').html(this.json_to_table(this.results));
          } else {
            if (!(this.results_array != null)) {
              this.results_array = [];
              this.results_array.push(this.results);
            }
            this.$('.table_view').html(this.json_to_table(this.results_array));
          }
          this.$('.results').hide();
          this.$('.table_view_container').show();
          this.$('.link_to_table_view').addClass('active');
          this.$('.link_to_table_view').parent().addClass('active');
          if (this.container.state.last_keys.length !== previous_keys.length) {
            same_keys = false;
          } else {
            same_keys = true;
            _ref2 = this.container.state.last_keys;
            for (index = _i = 0, _len = _ref2.length; _i < _len; index = ++_i) {
              keys = _ref2[index];
              if (this.container.state.last_keys[index] !== previous_keys[index]) {
                same_keys = false;
              }
            }
          }
          if (same_keys === true) {
            _ref3 = this.container.state.last_columns_size;
            for (col in _ref3) {
              value = _ref3[col];
              this.resize_column(col, value);
            }
          } else {
            this.last_column_size = {};
          }
          extra_size_table = this.$('.json_table_container').width() - this.$('.json_table').width();
          if (extra_size_table > 0) {
            expandable_columns = [];
            for (index = _j = 0, _ref4 = this.last_keys.length - 1; 0 <= _ref4 ? _j <= _ref4 : _j >= _ref4; index = 0 <= _ref4 ? ++_j : --_j) {
              real_size = 0;
              this.$('.col-' + index).children().children().children().each(function(i, bloc) {
                var $bloc;
                $bloc = $(bloc);
                if (real_size < $bloc.width()) {
                  return real_size = $bloc.width();
                }
              });
              if ((real_size != null) && real_size === real_size && real_size > this.default_size_column) {
                expandable_columns.push({
                  col: index,
                  size: real_size + 20
                });
              }
            }
            while (expandable_columns.length > 0) {
              expandable_columns.sort(function(a, b) {
                return a.size - b.size;
              });
              if (expandable_columns[0].size - this.$('.col-' + expandable_columns[0].col).width() < extra_size_table / expandable_columns.length) {
                extra_size_table = extra_size_table - (expandable_columns[0]['size'] - this.$('.col-' + expandable_columns[0].col).width());
                this.$('.col-' + expandable_columns[0]['col']).css('max-width', expandable_columns[0]['size']);
                this.$('.value-' + expandable_columns[0]['col']).css('max-width', expandable_columns[0]['size'] - 20);
                expandable_columns.shift();
              } else {
                max_size = extra_size_table / expandable_columns.length;
                for (_k = 0, _len1 = expandable_columns.length; _k < _len1; _k++) {
                  column = expandable_columns[_k];
                  current_size = this.$('.col-' + expandable_columns[0].col).width();
                  this.$('.col-' + expandable_columns[0]['col']).css('max-width', current_size + max_size);
                  this.$('.value-' + expandable_columns[0]['col']).css('max-width', current_size + max_size - 20);
                }
                expandable_columns = [];
              }
            }
          }
          break;
        case 'raw':
          this.$('.raw_view_textarea').html(JSON.stringify(this.results));
          this.$('.results').hide();
          this.$('.raw_view_container').show();
          this.expand_raw_textarea();
          this.$('.link_to_raw_view').addClass('active');
          this.$('.link_to_raw_view').parent().addClass('active');
      }
      this.set_scrollbar();
      this.delegateEvents();
      return this;
    };

    ResultView.prototype.cursor_timed_out = function() {
      var _ref;
      this.container.state.cursor_timed_out = true;
      if (((_ref = this.container.state.metadata) != null ? _ref.has_more_data : void 0) === true) {
        return this.$('.more_results_paragraph').html(this.cursor_timed_out_template());
      }
    };

    ResultView.prototype.render = function() {
      this.delegateEvents();
      return this;
    };

    ResultView.prototype.render_default = function() {
      return this;
    };

    ResultView.prototype.prettify_duration = function(duration) {
      var minutes;
      if (duration < 1) {
        return '<1ms';
      } else if (duration < 1000) {
        return duration.toFixed(0) + "ms";
      } else if (duration < 60 * 1000) {
        return (duration / 1000).toFixed(2) + "s";
      } else {
        minutes = Math.floor(duration / (60 * 1000));
        return minutes + "min " + ((duration - minutes * 60 * 1000) / 1000).toFixed(2) + "s";
      }
    };

    ResultView.prototype.compute_total_duration = function(profile) {
      var task, total_duration, _i, _len;
      total_duration = 0;
      for (_i = 0, _len = profile.length; _i < _len; _i++) {
        task = profile[_i];
        if (task['duration(ms)'] != null) {
          total_duration += task['duration(ms)'];
        }
      }
      return total_duration;
    };

    ResultView.prototype.compute_num_shard_accesses = function(profile) {
      var num_shard_accesses, task, _i, _len;
      num_shard_accesses = 0;
      for (_i = 0, _len = profile.length; _i < _len; _i++) {
        task = profile[_i];
        if (task['description'] === 'Perform read on shard.') {
          num_shard_accesses += 1;
        }
        if (Object.prototype.toString.call(task['sub_tasks']) === '[object Array]') {
          num_shard_accesses += this.compute_num_shard_accesses(task['sub_tasks']);
        }
        if (Object.prototype.toString.call(task['parallel_tasks']) === '[object Array]') {
          num_shard_accesses += this.compute_num_shard_accesses(task['parallel_tasks']);
        }
        if (Object.prototype.toString.call(task) === '[object Array]') {
          num_shard_accesses += this.compute_num_shard_accesses(task);
        }
      }
      return num_shard_accesses;
    };

    ResultView.prototype.destroy = function() {
      $(window).unbind('scroll');
      return $(window).unbind('resize');
    };

    return ResultView;

  })(DataExplorerView.SharedResultView);
  this.OptionsView = (function(_super) {

    __extends(OptionsView, _super);

    function OptionsView() {
      this.render = __bind(this.render, this);

      this.toggle_option = __bind(this.toggle_option, this);

      this.initialize = __bind(this.initialize, this);
      return OptionsView.__super__.constructor.apply(this, arguments);
    }

    OptionsView.prototype.dataexplorer_options_template = Handlebars.templates['dataexplorer-options-template'];

    OptionsView.prototype.className = 'options_view';

    OptionsView.prototype.events = {
      'click li': 'toggle_option'
    };

    OptionsView.prototype.initialize = function(args) {
      this.container = args.container;
      this.options = args.options;
      return this.state = 'hidden';
    };

    OptionsView.prototype.toggle_option = function(event) {
      var new_target, new_value;
      event.preventDefault();
      new_target = this.$(event.target).data('option');
      this.$('#' + new_target).prop('checked', !this.options[new_target]);
      if (event.target.nodeName !== 'INPUT') {
        new_value = this.$('#' + new_target).is(':checked');
        this.options[new_target] = new_value;
        if (window.localStorage != null) {
          window.localStorage.options = JSON.stringify(this.options);
        }
        if (new_target === 'profiler' && new_value === false) {
          return this.$('.profiler_enabled').slideUp('fast');
        }
      }
    };

    OptionsView.prototype.render = function(displayed) {
      this.$el.html(this.dataexplorer_options_template(this.options));
      if (displayed === true) {
        this.$el.show();
      }
      this.delegateEvents();
      return this;
    };

    return OptionsView;

  })(Backbone.View);
  this.HistoryView = (function(_super) {

    __extends(HistoryView, _super);

    function HistoryView() {
      this.clear_history = __bind(this.clear_history, this);

      this.add_query = __bind(this.add_query, this);

      this.delete_query = __bind(this.delete_query, this);

      this.load_query = __bind(this.load_query, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);

      this.handle_mouseup = __bind(this.handle_mouseup, this);

      this.handle_mousemove = __bind(this.handle_mousemove, this);

      this.start_resize = __bind(this.start_resize, this);
      return HistoryView.__super__.constructor.apply(this, arguments);
    }

    HistoryView.prototype.dataexplorer_history_template = Handlebars.templates['dataexplorer-history-template'];

    HistoryView.prototype.dataexplorer_query_li_template = Handlebars.templates['dataexplorer-query_li-template'];

    HistoryView.prototype.className = 'history_container';

    HistoryView.prototype.size_history_displayed = 300;

    HistoryView.prototype.state = 'hidden';

    HistoryView.prototype.index_displayed = 0;

    HistoryView.prototype.events = {
      'click .load_query': 'load_query',
      'click .delete_query': 'delete_query'
    };

    HistoryView.prototype.start_resize = function(event) {
      this.start_y = event.pageY;
      this.start_height = this.container.$('.nano').height();
      this.mouse_down = true;
      return $('body').toggleClass('resizing', true);
    };

    HistoryView.prototype.handle_mousemove = function(event) {
      if (this.mouse_down === true) {
        this.height_history = Math.max(0, this.start_height - this.start_y + event.pageY);
        return this.container.$('.nano').height(this.height_history);
      }
    };

    HistoryView.prototype.handle_mouseup = function(event) {
      if (this.mouse_down === true) {
        this.mouse_down = false;
        $('.nano').nanoScroller({
          preventPageScrolling: true
        });
        return $('body').toggleClass('resizing', false);
      }
    };

    HistoryView.prototype.initialize = function(args) {
      this.container = args.container;
      this.history = args.history;
      return this.height_history = 204;
    };

    HistoryView.prototype.render = function(displayed) {
      var i, query, _i, _len, _ref;
      this.$el.html(this.dataexplorer_history_template());
      if (displayed === true) {
        this.$el.show();
      }
      if (this.history.length === 0) {
        this.$('.history_list').append(this.dataexplorer_query_li_template({
          no_query: true,
          displayed_class: 'displayed'
        }));
      } else {
        _ref = this.history;
        for (i = _i = 0, _len = _ref.length; _i < _len; i = ++_i) {
          query = _ref[i];
          this.$('.history_list').append(this.dataexplorer_query_li_template({
            query: query.query,
            broken_query: query.broken_query,
            id: i,
            num: i + 1
          }));
        }
      }
      this.delegateEvents();
      return this;
    };

    HistoryView.prototype.load_query = function(event) {
      var id;
      id = this.$(event.target).data().id;
      this.container.codemirror.setValue(this.history[parseInt(id)].query);
      return this.container.state.current_query = this.history[parseInt(id)].query;
    };

    HistoryView.prototype.delete_query = function(event) {
      var id, is_at_bottom, that,
        _this = this;
      that = this;
      id = parseInt(this.$(event.target).data().id);
      this.history.splice(id, 1);
      window.localStorage.rethinkdb_history = JSON.stringify(this.history);
      is_at_bottom = this.$('.history_list').height() === $('.nano > .content').scrollTop() + $('.nano').height();
      return this.$('#query_history_' + id).slideUp('fast', function() {
        that.$(_this).remove();
        that.render();
        return that.container.adjust_collapsible_panel_height({
          is_at_bottom: is_at_bottom
        });
      });
    };

    HistoryView.prototype.add_query = function(args) {
      var broken_query, is_at_bottom, query, that;
      query = args.query;
      broken_query = args.broken_query;
      that = this;
      is_at_bottom = this.$('.history_list').height() === $('.nano > .content').scrollTop() + $('.nano').height();
      this.$('.history_list').append(this.dataexplorer_query_li_template({
        query: query,
        broken_query: broken_query,
        id: this.history.length - 1,
        num: this.history.length
      }));
      if (this.$('.no_history').length > 0) {
        return this.$('.no_history').slideUp('fast', function() {
          $(this).remove();
          return that.container.adjust_collapsible_panel_height({
            is_at_bottom: is_at_bottom
          });
        });
      } else if (this.state === 'visible') {
        return this.container.adjust_collapsible_panel_height({
          delay_scroll: true,
          is_at_bottom: is_at_bottom
        });
      }
    };

    HistoryView.prototype.clear_history = function(event) {
      var that;
      that = this;
      event.preventDefault();
      this.container.clear_history();
      this.history = this.container.history;
      this.$('.query_history').slideUp('fast', function() {
        $(this).remove();
        if (that.$('.no_history').length === 0) {
          that.$('.history_list').append(that.dataexplorer_query_li_template({
            no_query: true,
            displayed_class: 'hidden'
          }));
          return that.$('.no_history').slideDown('fast');
        }
      });
      return that.container.adjust_collapsible_panel_height({
        size: 40,
        move_arrow: 'show',
        is_at_bottom: 'true'
      });
    };

    return HistoryView;

  })(Backbone.View);
  return this.DriverHandler = (function() {

    DriverHandler.prototype.ping_time = 5 * 60 * 1000;

    DriverHandler.prototype.query_error_template = Handlebars.templates['dataexplorer-query_error-template'];

    function DriverHandler(args) {
      this.destroy = __bind(this.destroy, this);

      this.ping = __bind(this.ping, this);

      this.connect_callback = __bind(this.connect_callback, this);

      this.connect = __bind(this.connect, this);

      this.hack_driver = __bind(this.hack_driver, this);

      var port;
      this.on_success = args.on_success;
      this.on_fail = args.on_fail;
      if (window.location.port === '') {
        if (window.location.protocol === 'https:') {
          port = 443;
        } else {
          port = 80;
        }
      } else {
        port = parseInt(window.location.port);
      }
      this.server = {
        host: window.location.hostname,
        port: port,
        protocol: window.location.protocol === 'https:' ? 'https' : 'http',
        pathname: window.location.pathname
      };
      this.hack_driver();
      this.connect();
    }

    DriverHandler.prototype.hack_driver = function() {
      var TermBase, that;
      TermBase = r.expr(1).constructor.__super__.constructor.__super__;
      if (!(TermBase.private_run != null)) {
        that = this;
        TermBase.private_run = TermBase.run;
        return TermBase.run = function() {
          throw that.query_error_template({
            found_run: true
          });
        };
      }
    };

    DriverHandler.prototype.connect = function() {
      var that;
      that = this;
      if (this.connection != null) {
        if (this.driver_status === 'connected') {
          try {
            this.connection.close();
          } catch (err) {

          }
        }
      }
      try {
        r.connect(this.server, this.connect_callback);
        return this.interval = setInterval(this.ping, this.ping_time);
      } catch (err) {
        return this.on_fail(err);
      }
    };

    DriverHandler.prototype.connect_callback = function(err, connection) {
      if (err != null) {
        return this.on_fail(err);
      } else {
        this.connection = connection;
        this.on_success(connection);
        connection.removeAllListeners('error');
        return connection.on('error', this.on_fail);
      }
    };

    DriverHandler.prototype.ping = function() {
      return r.expr(1).private_run(this.connection, function() {
        return this;
      });
    };

    DriverHandler.prototype.destroy = function() {
      try {
        this.connection.close();
      } catch (err) {

      }
      return clearTimeout(this.interval);
    };

    return DriverHandler;

  })();
});

module('Sidebar', function() {
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.issues_being_resolved = __bind(this.issues_being_resolved, this);

      this.remove_parent_alert = __bind(this.remove_parent_alert, this);

      this.toggle_showing_issues = __bind(this.toggle_showing_issues, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.className = 'sidebar-container';

    Container.prototype.template = Handlebars.templates['sidebar-container-template'];

    Container.prototype.template_dataexplorer = Handlebars.templates['sidebar-dataexplorer_container-template'];

    Container.prototype.events = function() {
      return {
        'click .show-issues': 'toggle_showing_issues',
        'click .hide-issues': 'toggle_showing_issues',
        'click a.change-route': 'toggle_showing_issues',
        'click #issue-alerts .alert .close': 'remove_parent_alert'
      };
    };

    Container.prototype.initialize = function() {
      this.client_connectivity_status = new Sidebar.ClientConnectionStatus();
      this.servers_connected = new Sidebar.ServersConnected();
      this.datacenters_connected = new Sidebar.DatacentersConnected();
      this.issues = new Sidebar.Issues();
      this.issues_banner = new Sidebar.IssuesBanner();
      this.all_issues = new ResolveIssuesView.Container;
      this.showing_all_issues = false;
      issues.on('remove', this.issues_being_resolved);
      return issues.on('reset', this.issues_being_resolved);
    };

    Container.prototype.render = function() {
      this.$el.html(this.template({}));
      this.$('.client-connection-status').html(this.client_connectivity_status.render().el);
      this.$('.servers-connected').html(this.servers_connected.render().el);
      this.$('.datacenters-connected').html(this.datacenters_connected.render().el);
      this.$('.issues').html(this.issues.render().el);
      this.$('.issues-banner').html(this.issues_banner.render().el);
      this.$('.all-issues').html(this.all_issues.render().$el);
      return this;
    };

    Container.prototype.toggle_showing_issues = function() {
      this.showing_all_issues = !this.showing_all_issues;
      if (this.showing_all_issues) {
        this.$('.all-issues').show();
      } else {
        this.$('.all-issues').hide();
      }
      return this.issues_banner.set_showing_issues(this.showing_all_issues);
    };

    Container.prototype.remove_parent_alert = function(event) {
      var element,
        _this = this;
      element = $(event.target).parent();
      return element.slideUp('fast', function() {
        element.remove();
        _this.issues_being_resolved();
        return _this.issues_banner.render();
      });
    };

    Container.prototype.issues_being_resolved = function() {
      if (issues.length === 0 && this.$('#issue-alerts').children().length === 0) {
        this.$('.all-issues').hide();
        this.showing_all_issues = false;
        return this.issues_banner.set_showing_issues(this.showing_all_issues);
      }
    };

    Container.prototype.destroy = function() {
      issues.off('remove', this.issues_being_resolved);
      issues.off('reset', this.issues_being_resolved);
      this.client_connectivity_status.destroy();
      this.servers_connected.destroy();
      this.datacenters_connected.destroy();
      this.issues.destroy();
      this.issues_banner.destroy();
      return this.all_issues.destroy();
    };

    return Container;

  })(Backbone.View);
  this.ClientConnectionStatus = (function(_super) {

    __extends(ClientConnectionStatus, _super);

    function ClientConnectionStatus() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return ClientConnectionStatus.__super__.constructor.apply(this, arguments);
    }

    ClientConnectionStatus.prototype.className = 'client-connection-status';

    ClientConnectionStatus.prototype.template = Handlebars.templates['sidebar-client_connection_status-template'];

    ClientConnectionStatus.prototype.initialize = function() {
      connection_status.on('all', this.render);
      machines.on('all', this.render);
      return this.data = '';
    };

    ClientConnectionStatus.prototype.render = function() {
      var data, data_in_json;
      data = {
        disconnected: connection_status.get('client_disconnected'),
        machine_name: ((connection_status.get('contact_machine_id') != null) && (machines.get(connection_status.get('contact_machine_id')) != null) ? machines.get(connection_status.get('contact_machine_id')).get('name') : void 0)
      };
      data_in_json = JSON.stringify(data);
      if (this.data !== data_in_json) {
        this.$el.html(this.template(data));
        this.data = data_in_json;
      }
      return this;
    };

    ClientConnectionStatus.prototype.destroy = function() {
      connection_status.off('all', this.render);
      return machines.off('all', this.render);
    };

    return ClientConnectionStatus;

  })(Backbone.View);
  this.ServersConnected = (function(_super) {

    __extends(ServersConnected, _super);

    function ServersConnected() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return ServersConnected.__super__.constructor.apply(this, arguments);
    }

    ServersConnected.prototype.template = Handlebars.templates['sidebar-servers_connected-template'];

    ServersConnected.prototype.initialize = function() {
      directory.on('all', this.render);
      machines.on('all', this.render);
      return this.data = '';
    };

    ServersConnected.prototype.render = function() {
      var data, data_in_json, machine, servers_active, _i, _len, _ref;
      servers_active = 0;
      _ref = directory.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        if (directory.get(machine.get('id')) != null) {
          servers_active++;
        }
      }
      data = {
        servers_active: servers_active,
        servers_total: machines.length,
        servers_not_reachable: servers_active < machines.length
      };
      data_in_json = JSON.stringify(data);
      if (this.data !== data_in_json) {
        this.$el.html(this.template(data));
        this.data = data_in_json;
      }
      return this;
    };

    ServersConnected.prototype.destroy = function() {
      directory.off('all', this.render);
      return machines.off('all', this.render);
    };

    return ServersConnected;

  })(Backbone.View);
  this.DatacentersConnected = (function(_super) {

    __extends(DatacentersConnected, _super);

    function DatacentersConnected() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.compute_connectivity = __bind(this.compute_connectivity, this);

      this.initialize = __bind(this.initialize, this);
      return DatacentersConnected.__super__.constructor.apply(this, arguments);
    }

    DatacentersConnected.prototype.template = Handlebars.templates['sidebar-datacenters_connected-template'];

    DatacentersConnected.prototype.initialize = function() {
      directory.on('all', this.render);
      machines.on('all', this.render);
      datacenters.on('all', this.render);
      return this.data = '';
    };

    DatacentersConnected.prototype.compute_connectivity = function() {
      var conn, dc_visible,
        _this = this;
      dc_visible = [];
      directory.each(function(m) {
        var _m;
        _m = machines.get(m.get('id'));
        if (_m && _m.get('datacenter_uuid') && _m.get('datacenter_uuid') !== universe_datacenter.get('id')) {
          return dc_visible.push(_m.get('datacenter_uuid'));
        }
      });
      datacenters.each(function(dc) {
        if (DataUtils.get_datacenter_machines(dc.get('id')).length === 0) {
          return dc_visible.push(dc.get('id'));
        }
      });
      dc_visible = _.uniq(dc_visible);
      conn = {
        datacenters_active: dc_visible.length,
        datacenters_total: datacenters.models.length,
        datacenters_not_reachable: dc_visible.length < datacenters.length
      };
      return conn;
    };

    DatacentersConnected.prototype.render = function() {
      var data, data_in_json;
      data = this.compute_connectivity();
      data_in_json = JSON.stringify(data);
      if (this.data !== data_in_json) {
        this.$el.html(this.template(data));
        this.data = data_in_json;
      }
      return this;
    };

    DatacentersConnected.prototype.destroy = function() {
      directory.off('all', this.render);
      machines.off('all', this.render);
      return datacenters.off('all', this.render);
    };

    return DatacentersConnected;

  })(Backbone.View);
  this.Issues = (function(_super) {

    __extends(Issues, _super);

    function Issues() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return Issues.__super__.constructor.apply(this, arguments);
    }

    Issues.prototype.className = 'issues';

    Issues.prototype.template = Handlebars.templates['sidebar-issues-template'];

    Issues.prototype.initialize = function() {
      issues.on('all', this.render);
      return this.issues_length = -1;
    };

    Issues.prototype.render = function() {
      if (issues.length !== this.issues_length) {
        this.$el.html(this.template({
          num_issues: issues.length
        }));
        this.issues_length = issues.length;
      }
      return this;
    };

    Issues.prototype.destroy = function() {
      return issues.off('all', this.render);
    };

    return Issues;

  })(Backbone.View);
  return this.IssuesBanner = (function(_super) {

    __extends(IssuesBanner, _super);

    function IssuesBanner() {
      this.destroy = __bind(this.destroy, this);

      this.set_showing_issues = __bind(this.set_showing_issues, this);

      this.render = __bind(this.render, this);

      this.initialize = __bind(this.initialize, this);
      return IssuesBanner.__super__.constructor.apply(this, arguments);
    }

    IssuesBanner.prototype.template = Handlebars.templates['sidebar-issues_banner-template'];

    IssuesBanner.prototype.resolve_issues_route = '#resolve_issues';

    IssuesBanner.prototype.initialize = function() {
      issues.on('all', this.render);
      this.showing_issues = false;
      return this.data = {};
    };

    IssuesBanner.prototype.render = function() {
      var data;
      data = {
        num_issues: issues.length,
        no_issues: issues.length === 0,
        show_banner: issues.length > 0 || $('#issue-alerts').children().length > 0
      };
      if (_.isEqual(data, this.data) === false) {
        this.data = data;
        this.$el.html(this.template(this.data));
        if (this.showing_issues) {
          this.set_showing_issues(this.showing_issues);
        }
      }
      return this;
    };

    IssuesBanner.prototype.set_showing_issues = function(showing) {
      this.showing_issues = showing;
      if (showing) {
        this.$('.show-issues').hide();
        return this.$('.hide-issues').show();
      } else {
        this.$('.show-issues').show();
        return this.$('.hide-issues').hide();
      }
    };

    IssuesBanner.prototype.destroy = function() {
      return issues.off('all', this.render);
    };

    return IssuesBanner;

  })(Backbone.View);
});

module('ResolveIssuesView', function() {
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.render = __bind(this.render, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.id = 'resolve-issues';

    Container.prototype.className = 'section';

    Container.prototype.template = Handlebars.templates['resolve_issues-container-template'];

    Container.prototype.initialize = function() {
      return this.issue_list = new ResolveIssuesView.IssueList();
    };

    Container.prototype.render = function() {
      this.$el.html(this.template());
      this.$('.issue-list').html(this.issue_list.render().el);
      return this;
    };

    return Container;

  })(UIComponents.AbstractList);
  this.IssueList = (function(_super) {

    __extends(IssueList, _super);

    function IssueList() {
      return IssueList.__super__.constructor.apply(this, arguments);
    }

    IssueList.prototype.template = Handlebars.templates['resolve_issues-issue_list-template'];

    IssueList.prototype.initialize = function() {
      return IssueList.__super__.initialize.call(this, issues, ResolveIssuesView.Issue, '.issues');
    };

    return IssueList;

  })(UIComponents.AbstractList);
  this.DeclareMachineDeadModal = (function(_super) {

    __extends(DeclareMachineDeadModal, _super);

    function DeclareMachineDeadModal() {
      this.on_success_with_error = __bind(this.on_success_with_error, this);
      return DeclareMachineDeadModal.__super__.constructor.apply(this, arguments);
    }

    DeclareMachineDeadModal.prototype.template = Handlebars.templates['declare_machine_dead-modal-template'];

    DeclareMachineDeadModal.prototype.alert_tmpl = Handlebars.templates['resolve_issues-resolved-template'];

    DeclareMachineDeadModal.prototype.template_issue_error = Handlebars.templates['fail_solve_issue-template'];

    DeclareMachineDeadModal.prototype["class"] = 'declare-machine-dead';

    DeclareMachineDeadModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: declare machine dead');
      return DeclareMachineDeadModal.__super__.initialize.call(this, this.template);
    };

    DeclareMachineDeadModal.prototype.render = function(_machine_to_kill) {
      log_render('(rendering) declare machine dead dialog');
      this.machine_to_kill = _machine_to_kill;
      return DeclareMachineDeadModal.__super__.render.call(this, {
        machine_name: this.machine_to_kill.get("name"),
        modal_title: "Declare server dead",
        btn_primary_text: 'Declare Dead'
      });
    };

    DeclareMachineDeadModal.prototype.on_submit = function() {
      DeclareMachineDeadModal.__super__.on_submit.apply(this, arguments);
      return $.ajax({
        url: "ajax/semilattice/machines/" + this.machine_to_kill.id,
        type: 'DELETE',
        contentType: 'application/json',
        success: this.on_success,
        error: this.on_error
      });
    };

    DeclareMachineDeadModal.prototype.on_success_with_error = function() {
      this.$('.error_answer').html(this.template_issue_error);
      if (this.$('.error_answer').css('display') === 'none') {
        this.$('.error_answer').slideDown('fast');
      } else {
        this.$('.error_answer').css('display', 'none');
        this.$('.error_answer').fadeIn();
      }
      return this.reset_buttons();
    };

    DeclareMachineDeadModal.prototype.on_success = function(response) {
      var blueprint, namespace, _i, _len, _ref;
      if (response) {
        this.on_success_with_error();
        return;
      }
      $('#issue-alerts').append(this.alert_tmpl({
        machine_dead: {
          machine_name: this.machine_to_kill.get("name")
        }
      }));
      $.ajax({
        url: 'ajax/issues',
        contentType: 'application/json',
        success: set_issues,
        async: false
      });
      DeclareMachineDeadModal.__super__.on_success.apply(this, arguments);
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        blueprint = namespace.get('blueprint');
        if (this.machine_to_kill.get("id") in blueprint.peers_roles) {
          delete blueprint.peers_roles[this.machine_to_kill.get('id')];
          namespace.set('blueprint', blueprint);
        }
      }
      return machines.remove(this.machine_to_kill.id);
    };

    return DeclareMachineDeadModal;

  })(UIComponents.AbstractModal);
  this.ResolveNameConflictModal = (function(_super) {

    __extends(ResolveNameConflictModal, _super);

    function ResolveNameConflictModal() {
      this.on_success_ = __bind(this.on_success_, this);

      this.render = __bind(this.render, this);
      return ResolveNameConflictModal.__super__.constructor.apply(this, arguments);
    }

    ResolveNameConflictModal.prototype.alert_tmpl_ = Handlebars.templates['resolve_issues-resolved-template'];

    ResolveNameConflictModal.prototype.render = function(uuid, type) {
      var rename_modal;
      this.type = type;
      rename_modal = new UIComponents.RenameItemModal(uuid, type, this.on_success_, {
        hide_alert: true
      });
      rename_modal.render();
      return this;
    };

    ResolveNameConflictModal.prototype.on_success_ = function() {
      $('#issue-alerts').append(this.alert_tmpl_({
        name_conflict: {
          type: this.type
        }
      }));
      $.ajax({
        url: 'ajax/issues',
        contentType: 'application/json',
        success: set_issues,
        async: false
      });
      return this;
    };

    return ResolveNameConflictModal;

  })(Backbone.View);
  this.ResolveVClockModal = (function(_super) {

    __extends(ResolveVClockModal, _super);

    function ResolveVClockModal() {
      return ResolveVClockModal.__super__.constructor.apply(this, arguments);
    }

    ResolveVClockModal.prototype.template = Handlebars.templates['resolve_vclock-modal-template'];

    ResolveVClockModal.prototype.alert_tmpl = Handlebars.templates['resolve_issues-resolved-template'];

    ResolveVClockModal.prototype["class"] = 'resolve-vclock-modal';

    ResolveVClockModal.prototype.initialize = function() {
      log_initial('(initializing) modal dialog: resolve vclock');
      return ResolveVClockModal.__super__.initialize.apply(this, arguments);
    };

    ResolveVClockModal.prototype.render = function(_final_value, _resolution_url) {
      this.final_value = _final_value;
      this.resolution_url = _resolution_url;
      log_render('(rendering) resolve vclock');
      return ResolveVClockModal.__super__.render.call(this, {
        final_value: JSON.stringify(this.final_value),
        modal_title: 'Resolve configuration conflict',
        btn_primary_text: 'Resolve'
      });
    };

    ResolveVClockModal.prototype.on_submit = function() {
      ResolveVClockModal.__super__.on_submit.apply(this, arguments);
      return $.ajax({
        url: this.resolution_url,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(this.final_value),
        success: this.on_success,
        error: this.on_error
      });
    };

    ResolveVClockModal.prototype.on_success = function(response) {
      $('#issue-alerts').append(this.alert_tmpl({
        vclock_conflict: {
          final_value: this.final_value
        }
      }));
      $.ajax({
        url: 'ajax/issues',
        contentType: 'application/json',
        success: set_issues,
        async: false
      });
      return ResolveVClockModal.__super__.on_success.apply(this, arguments);
    };

    return ResolveVClockModal;

  })(UIComponents.AbstractModal);
  this.ResolveUnsatisfiableGoal = (function(_super) {

    __extends(ResolveUnsatisfiableGoal, _super);

    function ResolveUnsatisfiableGoal() {
      return ResolveUnsatisfiableGoal.__super__.constructor.apply(this, arguments);
    }

    ResolveUnsatisfiableGoal.prototype.template = Handlebars.templates['resolve_unsatisfiable_goals_modal-template'];

    ResolveUnsatisfiableGoal.prototype.alert_tmpl = Handlebars.templates['resolve_issues-resolved-template'];

    ResolveUnsatisfiableGoal.prototype["class"] = 'resolve-vclock-modal';

    ResolveUnsatisfiableGoal.prototype.initialize = function(namespace, datacenters_with_issues, can_be_solved) {
      log_initial('(initializing) modal dialog: resolve vclock');
      this.namespace = namespace;
      this.datacenters_with_issues = datacenters_with_issues;
      this.can_be_solved = can_be_solved;
      return ResolveUnsatisfiableGoal.__super__.initialize.apply(this, arguments);
    };

    ResolveUnsatisfiableGoal.prototype.render = function(data) {
      log_render('(rendering) resolve unsatisfiable goal');
      return ResolveUnsatisfiableGoal.__super__.render.call(this, {
        namespace_id: this.namespace.get('id'),
        namespace_name: this.namespace.get('name'),
        datacenters_with_issues: this.datacenters_with_issues,
        modal_title: "Lower number of replicas"
      });
    };

    ResolveUnsatisfiableGoal.prototype.on_submit = function() {
      var ack_expectations_to_send, datacenter, replica_affinities_to_send, _i, _len, _ref;
      ResolveUnsatisfiableGoal.__super__.on_submit.apply(this, arguments);
      replica_affinities_to_send = {};
      ack_expectations_to_send = {};
      _ref = this.datacenters_with_issues;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        datacenter = _ref[_i];
        if (datacenter.num_replicas > datacenter.num_machines) {
          replica_affinities_to_send[datacenter.datacenter_id] = datacenter.num_machines;
          ack_expectations_to_send[datacenter.datacenter_id] = this.namespace.get('ack_expectations')[datacenter.datacenter_id];
          if (ack_expectations_to_send[datacenter.datacenter_id].expectation > replica_affinities_to_send[datacenter.datacenter_id]) {
            ack_expectations_to_send[datacenter.datacenter_id].expectation = replica_affinities_to_send[datacenter.datacenter_id];
          }
          if (this.namespace.get('primary_uuid') === datacenter.datacenter_id) {
            replica_affinities_to_send[datacenter.datacenter_id]--;
          }
        }
      }
      return $.ajax({
        processData: false,
        url: "ajax/semilattice/" + (this.namespace.get("protocol")) + "_namespaces/" + this.namespace.id,
        contentType: 'application/json',
        type: 'POST',
        data: JSON.stringify({
          replica_affinities: replica_affinities_to_send,
          ack_expectations: ack_expectations_to_send
        }),
        success: this.on_success,
        error: this.on_error
      });
    };

    ResolveUnsatisfiableGoal.prototype.on_success = function() {
      $('#issue-alerts').append(this.alert_tmpl({
        unsatisfiable_goals: true,
        can_be_solved: this.can_be_solved
      }));
      $.ajax({
        url: 'ajax/issues',
        contentType: 'application/json',
        success: set_issues,
        async: false
      });
      return ResolveUnsatisfiableGoal.__super__.on_success.apply(this, arguments);
    };

    return ResolveUnsatisfiableGoal;

  })(UIComponents.AbstractModal);
  return this.Issue = (function(_super) {

    __extends(Issue, _super);

    function Issue() {
      this.render_machine_down = __bind(this.render_machine_down, this);
      return Issue.__super__.constructor.apply(this, arguments);
    }

    Issue.prototype.className = 'issue-container';

    Issue.prototype.templates = {
      'MACHINE_DOWN': Handlebars.templates['resolve_issues-machine_down-template'],
      'NAME_CONFLICT_ISSUE': Handlebars.templates['resolve_issues-name_conflict-template'],
      'LOGFILE_WRITE_ERROR': Handlebars.templates['resolve_issues-logfile_write-template'],
      'VCLOCK_CONFLICT': Handlebars.templates['resolve_issues-vclock_conflict-template'],
      'UNSATISFIABLE_GOALS': Handlebars.templates['resolve_issues-unsatisfiable_goals-template'],
      'MACHINE_GHOST': Handlebars.templates['resolve_issues-machine_ghost-template'],
      'PORT_CONFLICT': Handlebars.templates['resolve_issues-port_conflict-template']
    };

    Issue.prototype.unknown_issue_template = Handlebars.templates['resolve_issues-unknown-template'];

    Issue.prototype.render_machine_down = function(_template) {
      var json, machine, masters, replicas,
        _this = this;
      machine = machines.get(this.model.get('victim'));
      masters = [];
      replicas = [];
      namespaces.each(function(namespace) {
        var machine_uuid, role, role_summary, shard, _ref, _results;
        _ref = namespace.get('blueprint').peers_roles;
        _results = [];
        for (machine_uuid in _ref) {
          role_summary = _ref[machine_uuid];
          if (machine_uuid === machine.get('id')) {
            _results.push((function() {
              var _results1;
              _results1 = [];
              for (shard in role_summary) {
                role = role_summary[shard];
                if (role === 'role_primary') {
                  masters.push({
                    name: namespace.get('name'),
                    uuid: namespace.get('id'),
                    shard: human_readable_shard(shard)
                  });
                }
                if (role === 'role_secondary') {
                  _results1.push(replicas.push({
                    name: namespace.get('name'),
                    uuid: namespace.get('id'),
                    shard: human_readable_shard(shard)
                  }));
                } else {
                  _results1.push(void 0);
                }
              }
              return _results1;
            })());
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      });
      json = {
        name: machine.get('name'),
        masters: _.isEmpty(masters) ? null : masters,
        replicas: _.isEmpty(replicas) ? null : replicas,
        no_responsibilities: _.isEmpty(replicas) && _.isEmpty(masters) ? true : false,
        datetime: iso_date_from_unix_time(this.model.get('time')),
        critical: this.model.get('critical')
      };
      this.$('.solve-issue').off("click");
      this.$el.html(_template(json));
      return this.$('.solve-issue').click(function() {
        var declare_dead_modal;
        declare_dead_modal = new ResolveIssuesView.DeclareMachineDeadModal;
        return declare_dead_modal.render(machine);
      });
    };

    Issue.prototype.render_name_conflict_issue = function(_template) {
      var json,
        _this = this;
      json = {
        name: this.model.get('contested_name'),
        type: this.model.get('contested_type'),
        num_contestants: this.model.get('contestants').length,
        contestants: _.map(this.model.get('contestants'), function(uuid) {
          return {
            uuid: uuid,
            type: _this.model.get('contested_type')
          };
        }),
        datetime: iso_date_from_unix_time(this.model.get('time')),
        critical: this.model.get('critical')
      };
      this.$el.html(_template(json));
      return _.each(this.model.get('contestants'), function(uuid) {
        return _this.$("a#rename_" + uuid).click(function(e) {
          var rename_modal;
          e.preventDefault();
          rename_modal = new ResolveIssuesView.ResolveNameConflictModal();
          return rename_modal.render(uuid, _this.model.get('contested_type'));
        });
      });
    };

    Issue.prototype.render_logfile_write_issue = function(_template) {
      var json, _machine,
        _this = this;
      _machine = machines.get(this.model.get('location'));
      json = {
        datetime: iso_date_from_unix_time(this.model.get('time')),
        critical: this.model.get('critical'),
        machine_name: _machine ? _machine.get('name') : "N/A",
        machine_uuid: this.model.get('location')
      };
      this.$('.solve-issue').off("click");
      this.$el.html(_template(json));
      return this.$('.solve-issue').click(function() {
        var declare_dead_modal;
        declare_dead_modal = new ResolveIssuesView.DeclareMachineDeadModal;
        return declare_dead_modal.render(machines.get(_machine));
      });
    };

    Issue.prototype.render_vclock_conflict = function(_template) {
      var get_resolution_url, json, name, object_type, object_type_url,
        _this = this;
      get_resolution_url = function() {
        if (_this.model.get('field') === 'auth_key') {
          return 'ajax/auth/auth_key/resolve';
        } else if (_this.model.get('object_type') === 'namespace') {
          return 'ajax/semilattice/rdb_' + _this.model.get('object_type') + 's/' + _this.model.get('object_id') + '/' + _this.model.get('field') + '/resolve';
        } else {
          return 'ajax/semilattice/' + _this.model.get('object_type') + 's/' + _this.model.get('object_id') + '/' + _this.model.get('field') + '/resolve';
        }
      };
      if (this.contestants != null) {
        _.each(this.contestants, function(contestant) {
          return _this.$('#resolve_' + contestant.contestant_id).off('click');
        });
      }
      if (this.model.get('field') === 'blueprint') {
        this.contestants = [];
      } else {
        $.ajax({
          url: get_resolution_url(),
          type: 'GET',
          contentType: 'application/json',
          async: false,
          success: function(response) {
            return _this.contestants = _.map(response, function(x, index) {
              return {
                value: JSON.stringify(x[1]),
                contestant_id: index
              };
            });
          }
        });
      }
      switch (this.model.get('object_type')) {
        case 'machine':
          object_type_url = 'servers';
          object_type = 'server';
          if (machines.get(this.model.get('object_id')) != null) {
            name = machines.get(this.model.get('object_id')).get('name');
          } else {
            name = 'Unknown machine';
          }
          break;
        case 'datacenter':
          object_type_url = 'datacenters';
          object_type = 'datacenter';
          if (this.model.get('object_id') === universe_datacenter.get('id')) {
            name = universe_datacenter.get('name');
          } else if (datacenters.get(this.model.get('object_id')) != null) {
            name = datacenters.get(this.model.get('object_id')).get('name');
          } else {
            name = "Unknown datacenter";
          }
          break;
        case 'database':
          object_type_url = 'databases';
          object_type = 'database';
          if (databases.get(this.model.get('object_id')) != null) {
            name = databases.get(this.model.get('object_id')).get('name');
          } else {
            name = 'Unknown database';
          }
          break;
        case 'namespace':
          object_type = 'table';
          object_type_url = 'tables';
          if (namespaces.get(this.model.get('object_id')) != null) {
            name = namespaces.get(this.model.get('object_id')).get('name');
          } else {
            name = 'Unknown table';
          }
          break;
        case 'auth_key':
          object_type = 'the cluster';
      }
      json = {
        datetime: iso_date_from_unix_time(this.model.get('time')),
        critical: this.model.get('critical'),
        object_type: object_type,
        object_id: this.model.get('object_id'),
        object_name: name,
        object_type_url: object_type_url,
        field: this.model.get('field'),
        name_contest: this.model.get('field') === 'name',
        contestants: this.contestants
      };
      this.$el.html(_template(json));
      return _.each(this.contestants, function(contestant) {
        return _this.$('#resolve_' + contestant.contestant_id).click(function(event) {
          var resolve_modal;
          event.preventDefault();
          resolve_modal = new ResolveIssuesView.ResolveVClockModal;
          return resolve_modal.render(JSON.parse(contestant.value), get_resolution_url());
        });
      });
    };

    Issue.prototype.render_unsatisfiable_goals = function(_template) {
      var datacenter_id, datacenter_name, extra_replicas_accross_cluster, found_machine, json, machine, namespace, num_active_datacenters, num_replicas_requested, number_machines_in_datacenter, number_machines_requested_by_universe, number_machines_universe_can_use_if_no_known_issues, number_replicas, that, _i, _len, _ref, _ref1,
        _this = this;
      json = {
        datetime: iso_date_from_unix_time(this.model.get('time')),
        critical: this.model.get('critical'),
        namespace_id: this.model.get('namespace_id'),
        namespace_name: namespaces.get(this.model.get('namespace_id')).get('name'),
        datacenters_with_issues: []
      };
      namespace = namespaces.get(this.model.get('namespace_id'));
      if (this.model.get('primary_datacenter') !== universe_datacenter.get('id') && !(datacenters.get(this.model.get('primary_datacenter')) != null)) {
        json.no_primary = true;
      } else {
        number_machines_universe_can_use_if_no_known_issues = machines.length;
        if (this.model.get('primary_datacenter') === universe_datacenter) {
          number_machines_universe_can_use_if_no_known_issues--;
        }
        for (datacenter_id in this.model.get('replica_affinities')) {
          number_replicas = this.model.get('replica_affinities')[datacenter_id];
          if (datacenter_id === this.model.get('primary_datacenter')) {
            number_replicas++;
          }
          if (!(datacenters.get(datacenter_id) != null) && datacenter_id !== universe_datacenter.get('id')) {
            if (this.model.get('replica_affinities')[datacenter_id] !== 0) {
              json.datacenters_with_issues.push({
                datacenter_removed: true,
                datacenter_name: 'A removed datacenter',
                datacenter_id: datacenter_id,
                datacenter_id_small: datacenter_id.slice(30),
                num_replicas: number_replicas,
                num_machines: 0
              });
            }
          } else {
            if (this.model.get('actual_machines_in_datacenters')[datacenter_id] != null) {
              number_machines_in_datacenter = this.model.get('actual_machines_in_datacenters')[datacenter_id];
            } else {
              number_machines_in_datacenter = 0;
            }
            if (datacenter_id !== universe_datacenter.get('id') && number_replicas > number_machines_in_datacenter) {
              datacenter_name = datacenters.get(datacenter_id).get('name');
              json.datacenters_with_issues.push({
                datacenter_id: datacenter_id,
                datacenter_name: datacenter_name,
                num_replicas: number_replicas,
                num_machines: number_machines_in_datacenter,
                change_ack: namespace.get('ack_expectations')[datacenter_id].expectation > number_machines_in_datacenter
              });
            }
            if (datacenter_id !== universe_datacenter.get('id')) {
              number_machines_universe_can_use_if_no_known_issues -= Math.min(number_replicas, number_machines_in_datacenter);
            }
          }
        }
        if (!(this.model.get('replica_affinities')[this.model.get('primary_datacenter')] != null) && this.model.get('primary_datacenter') !== universe_datacenter.get('id')) {
          number_replicas = 1;
          found_machine = false;
          _ref = machines.models;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            machine = _ref[_i];
            if (machine.get('datacenter_uuid') === this.model.get('primary_datacenter')) {
              found_machine = true;
              break;
            }
          }
          if (found_machine === false) {
            datacenter_id = this.model.get('primary_datacenter');
            if (this.model.get('actual_machines_in_datacenters')[datacenter_id] != null) {
              number_machines_in_datacenter = this.model.get('actual_machines_in_datacenters')[datacenter_id];
            } else {
              number_machines_in_datacenter = 0;
            }
            json.datacenters_with_issues.push({
              datacenter_id: datacenter_id,
              datacenter_name: datacenters.get(datacenter_id).get('name'),
              num_replicas: number_replicas,
              num_machines: 0,
              change_ack: namespace.get('ack_expectations')[datacenter_id].expectation > number_machines_in_datacenter
            });
          }
        }
        number_machines_requested_by_universe = this.model.get('replica_affinities')[universe_datacenter.get('id')];
        if (this.model.get('primary_datacenter') === universe_datacenter.get('id')) {
          number_machines_requested_by_universe++;
        }
        if ((this.model.get('replica_affinities')[universe_datacenter.get('id')] != null) && number_machines_universe_can_use_if_no_known_issues < number_machines_requested_by_universe) {
          number_replicas = this.model.get('replica_affinities')[universe_datacenter.get('id')];
          if (datacenter_id === this.model.get('primary_datacenter')) {
            number_replicas++;
          }
          extra_replicas_accross_cluster = this.model.get('replica_affinities')[universe_datacenter.get('id')] - number_machines_universe_can_use_if_no_known_issues;
          num_active_datacenters = 0;
          for (datacenter_id in this.model.get('replica_affinities')) {
            if (this.model.get('replica_affinities')[datacenter_id] > 0) {
              num_active_datacenters++;
            }
          }
          if ((!(this.model.get('replica_affinities')[this.model.get('primary_datacenter')] != null)) || this.model.get('replica_affinities')[this.model.get('primary_datacenter')] === 0) {
            num_active_datacenters++;
          }
          if (num_active_datacenters === 1) {
            json.datacenters_with_issues.push({
              is_universe: true,
              datacenter_id: universe_datacenter.get('id'),
              num_replicas: number_replicas,
              num_machines: machines.length,
              change_ack: namespace.get('ack_expectations')[universe_datacenter.get('id')].expectation > machines.length
            });
          } else {
            json.extra_replicas_accross_cluster = {
              value: extra_replicas_accross_cluster,
              datacenters_that_can_help: []
            };
            for (datacenter_id in this.model.get('replica_affinities')) {
              num_replicas_requested = this.model.get('replica_affinities')[datacenter_id];
              if (this.model.get('primary_datacenter') === datacenter_id) {
                num_replicas_requested++;
              }
              if (num_replicas_requested > 0 && this.model.get('actual_machines_in_datacenters')[datacenter_id] > 0 && (datacenters.get(datacenter_id) != null) && datacenter_id !== universe_datacenter.get('id')) {
                datacenter_name = (_ref1 = datacenters.get(datacenter_id)) != null ? _ref1.get('name') : void 0;
                json.extra_replicas_accross_cluster.datacenters_that_can_help.push({
                  datacenter_id: datacenter_id,
                  datacenter_name: (datacenter_name != null ? datacenter_name : void 0),
                  num_replicas_requested: num_replicas_requested
                });
              }
            }
            json.extra_replicas_accross_cluster.datacenters_that_can_help.unshift({
              datacenter_id: universe_datacenter.get('id'),
              is_universe: true,
              num_replicas_requested: this.model.get('replica_affinities')[universe_datacenter.get('id')]
            });
          }
        }
        json.can_solve_issue = json.datacenters_with_issues.length > 0;
      }
      this.$el.html(_template(json));
      if (json.can_solve_issue) {
        return this.$('.solve-issue').click(function(event) {
          var resolve_modal;
          event.preventDefault();
          resolve_modal = new ResolveIssuesView.ResolveUnsatisfiableGoal(namespace, json.datacenters_with_issues, !(json.extra_replicas_accross_cluster != null));
          return resolve_modal.render();
        });
      } else {
        that = this;
        return this.$('.try-solve-issue').click(function() {
          return window.router.navigate('#tables/' + that.model.get('namespace_id'), {
            trigger: true
          });
        });
      }
    };

    Issue.prototype.render_machine_ghost = function(_template) {
      var json;
      json = {
        datetime: iso_date_from_unix_time(this.model.get('time')),
        critical: this.model.get('critical'),
        machine_id: this.model.get('ghost')
      };
      return this.$el.html(_template(json));
    };

    Issue.prototype.render_port_conflict = function(_template) {
      var json;
      json = {
        datetime: iso_date_from_unix_time(this.model.get('time')),
        critical: this.model.get('critical'),
        machine_id: this.model.get('location'),
        machine_name: machines.get(this.model.get('location')).get('name'),
        description: this.model.get('description')
      };
      return this.$el.html(_template(json));
    };

    Issue.prototype.render_unknown_issue = function(_template) {
      var json;
      json = {
        issue_type: this.model.get('type'),
        critical: this.model.get('critical'),
        raw_data: JSON.stringify(this.model, void 0, 2),
        datetime: iso_date_from_unix_time(this.model.get('time'))
      };
      return this.$el.html(_template(json));
    };

    Issue.prototype.render = function() {
      var _template;
      _template = this.templates[this.model.get('type')];
      switch (this.model.get('type')) {
        case 'MACHINE_DOWN':
          this.render_machine_down(_template);
          break;
        case 'NAME_CONFLICT_ISSUE':
          this.render_name_conflict_issue(_template);
          break;
        case 'LOGFILE_WRITE_ERROR':
          this.render_logfile_write_issue(_template);
          break;
        case 'VCLOCK_CONFLICT':
          this.render_vclock_conflict(_template);
          break;
        case 'UNSATISFIABLE_GOALS':
          this.render_unsatisfiable_goals(_template);
          break;
        case 'MACHINE_GHOST':
          this.render_machine_ghost(_template);
          break;
        case 'PORT_CONFLICT':
          this.render_port_conflict(_template);
          break;
        default:
          this.render_unknown_issue(this.unknown_issue_template);
      }
      this.$('abbr.timeago').timeago();
      return this;
    };

    return Issue;

  })(Backbone.View);
});

module('LogView', function() {
  this.Container = (function(_super) {

    __extends(Container, _super);

    function Container() {
      this.destroy = __bind(this.destroy, this);

      this.parse_new_log = __bind(this.parse_new_log, this);

      this.update_log_entries = __bind(this.update_log_entries, this);

      this.render_header = __bind(this.render_header, this);

      this.check_for_new_updates = __bind(this.check_for_new_updates, this);

      this.next_entries = __bind(this.next_entries, this);

      this.parse_log = __bind(this.parse_log, this);

      this.fetch_log_entries = __bind(this.fetch_log_entries, this);

      this.render = __bind(this.render, this);
      return Container.__super__.constructor.apply(this, arguments);
    }

    Container.prototype.className = 'log-view';

    Container.prototype.template = Handlebars.templates['log-container-template'];

    Container.prototype.header_template = Handlebars.templates['log-header-template'];

    Container.prototype.type = 'general';

    Container.prototype.max_log_entries = 20;

    Container.prototype.interval_update_log = 10000;

    Container.prototype.route = "ajax/log/_?";

    Container.prototype.displayed_logs = 0;

    Container.prototype.max_timestamp = 0;

    Container.prototype.compact = false;

    Container.prototype.log_route = '#logs';

    Container.prototype.events = function() {
      return {
        'click .next-log-entries': 'next_entries',
        'click .update-log-entries': 'update_log_entries'
      };
    };

    Container.prototype.initialize = function() {
      log_initial('(initializing) events view: container');
      if (this.options.route != null) {
        this.route = this.options.route;
      }
      if (this.options.type != null) {
        this.type = this.options.type;
      }
      if (this.options.filter != null) {
        this.filter = this.options.filter;
      }
      if (this.options.compact != null) {
        this.compact = this.options.compact;
      }
      this.current_logs = [];
      return this.set_interval = setInterval(this.check_for_new_updates, this.interval_update_log);
    };

    Container.prototype.render = function() {
      this.$el.html(this.template());
      this.$('.no-more-entries').hide();
      this.fetch_log_entries({
        max_length: this.max_log_entries
      });
      this.render_header();
      this.delegateEvents();
      return this;
    };

    Container.prototype.fetch_log_entries = function(url_params) {
      var param, route, value;
      route = this.route;
      for (param in url_params) {
        value = url_params[param];
        route += "&" + param + "=" + value;
      }
      return $.getJSON(route, this.parse_log);
    };

    Container.prototype.parse_log = function(log_data_from_server) {
      var attribute, entry, i, is_same_log, json, log, log_entries, log_saved, machine_uuid, view, _i, _j, _k, _l, _len, _len1, _len2, _ref, _ref1, _ref2;
      this.max_timestamp = 0;
      for (machine_uuid in log_data_from_server) {
        log_entries = log_data_from_server[machine_uuid];
        if ((this.filter != null) && !(this.filter[machine_uuid] != null)) {
          continue;
        }
        if (log_entries.length > 0) {
          if (this.max_timestamp < parseFloat(log_entries[log_entries.length - 1].timestamp)) {
            this.max_timestamp = parseFloat(log_entries[log_entries.length - 1].timestamp);
          }
        }
        for (_i = 0, _len = log_entries.length; _i < _len; _i++) {
          json = log_entries[_i];
          log_saved = false;
          _ref = this.current_logs;
          for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
            log = _ref[i];
            is_same_log = true;
            for (attribute in log.attributes) {
              if (!(json.attribute != null) || log.get(attribute) !== json.attribute) {
                is_same_log = false;
              }
            }
            if (is_same_log) {
              log_saved = true;
              break;
            }
          }
          if (log_saved === false) {
            _ref1 = this.current_logs;
            for (i = _k = 0, _len2 = _ref1.length; _k < _len2; i = ++_k) {
              log = _ref1[i];
              if (parseFloat(json.timestamp) > parseFloat(log.get('timestamp'))) {
                entry = new LogEntry(json);
                entry.set('machine_uuid', machine_uuid);
                this.current_logs.splice(i, 0, entry);
                log_saved = true;
                break;
              }
            }
          }
          if (log_saved === false) {
            entry = new LogEntry(json);
            entry.set('machine_uuid', machine_uuid);
            this.current_logs.push(entry);
          }
        }
      }
      if (this.current_logs.length <= this.displayed_logs) {
        this.$('.no-more-entries').show();
        this.$('.next-log-entries').hide();
      } else {
        for (i = _l = 0, _ref2 = this.max_log_entries - 1; 0 <= _ref2 ? _l <= _ref2 : _l >= _ref2; i = 0 <= _ref2 ? ++_l : --_l) {
          if (this.current_logs[this.displayed_logs] != null) {
            view = new LogView.LogEntry({
              model: this.current_logs[this.displayed_logs]
            });
            this.$('.log-entries').append(view.render(this.compact).el);
            this.displayed_logs++;
          } else {
            this.$('.no-more-entries').show();
            this.$('.next-log-entries-container').hide();
          }
        }
      }
      return this.render_header();
    };

    Container.prototype.next_entries = function(event) {
      event.preventDefault();
      return this.fetch_log_entries({
        max_length: this.max_log_entries,
        max_timestamp: this.max_timestamp
      });
    };

    Container.prototype.check_for_new_updates = function() {
      var min_timestamp, route, _ref,
        _this = this;
      min_timestamp = (_ref = this.current_logs[0]) != null ? _ref.get('timestamp') : void 0;
      if (min_timestamp != null) {
        route = this.route + ("&min_timestamp=" + min_timestamp);
        this.num_new_entries = 0;
        return $.getJSON(route, function(log_data_from_server) {
          var log_entries, machine_uuid;
          for (machine_uuid in log_data_from_server) {
            log_entries = log_data_from_server[machine_uuid];
            if ((_this.filter != null) && !(_this.filter[machine_uuid] != null)) {
              continue;
            }
            _this.num_new_entries += log_entries.length;
          }
          return _this.render_header();
        });
      }
    };

    Container.prototype.render_header = function() {
      var _ref, _ref1;
      return this.$('.header').html(this.header_template({
        new_entries: this.num_new_entries > 0,
        num_new_entries: this.num_new_entries,
        too_many_new_entries: this.num_new_entries > this.max_log_entries,
        max_log_entries: this.max_log_entries,
        has_logs: this.current_logs.length > 0,
        from_date: new XDate(((_ref = this.current_logs[0]) != null ? _ref.get('timestamp') : void 0) * 1000).toString("MMMM d, yyyy 'at' HH:mm:ss"),
        to_date: new XDate(((_ref1 = this.current_logs[this.displayed_logs - 1]) != null ? _ref1.get('timestamp') : void 0) * 1000).toString("MMMM d, yyyy 'at' HH:mm:ss"),
        logs_for: {
          general: this.type === 'general',
          machine: this.type === 'machine',
          datacenter: this.type === 'datacenter'
        }
      }));
    };

    Container.prototype.update_log_entries = function(event) {
      var route;
      event.preventDefault();
      if (this.num_new_entries > this.max_log_entries) {
        return this.render();
      } else {
        route = "ajax/log/_?min_timestamp=" + this.current_logs[0].get('timestamp');
        return $.getJSON(route, this.parse_new_log);
      }
    };

    Container.prototype.parse_new_log = function(log_data_from_server) {
      var entry, i, json, log, log_entries, log_saved, machine_uuid, rendered_view, view, _i, _j, _k, _len, _len1, _ref, _ref1;
      for (machine_uuid in log_data_from_server) {
        log_entries = log_data_from_server[machine_uuid];
        if ((this.filter != null) && !(this.filter[machine_uuid] != null)) {
          continue;
        }
        for (_i = 0, _len = log_entries.length; _i < _len; _i++) {
          json = log_entries[_i];
          log_saved = false;
          _ref = this.current_logs;
          for (i = _j = 0, _len1 = _ref.length; _j < _len1; i = ++_j) {
            log = _ref[i];
            if (parseFloat(json.timestamp) > parseFloat(log.get('timestamp'))) {
              entry = new LogEntry(json);
              entry.set('machine_uuid', machine_uuid);
              this.current_logs.splice(i, 0, entry);
              log_saved = true;
              break;
            }
          }
          if (log_saved === false) {
            entry = new LogEntry(json);
            entry.set('machine_uuid', machine_uuid);
            this.current_logs.push(entry);
          }
        }
      }
      for (i = _k = _ref1 = this.num_new_entries - 1; _ref1 <= 0 ? _k <= 0 : _k >= 0; i = _ref1 <= 0 ? ++_k : --_k) {
        view = new LogView.LogEntry({
          model: this.current_logs[i]
        });
        rendered_view = $(view.render().el);
        rendered_view.css('background-color', '#F8EEB1');
        this.$('.log-entries').prepend(view.render().el);
        rendered_view.animate({
          backgroundColor: '#FFF'
        }, 2000);
        this.displayed_logs++;
      }
      this.render_header();
      return this.$('.header .alert').remove();
    };

    Container.prototype.destroy = function() {
      return clearInterval(this.set_interval);
    };

    return Container;

  })(Backbone.View);
  return this.LogEntry = (function(_super) {

    __extends(LogEntry, _super);

    function LogEntry() {
      this.format_msg_small = __bind(this.format_msg_small, this);

      this.format_msg = __bind(this.format_msg, this);

      this.render = __bind(this.render, this);

      this.display_details = __bind(this.display_details, this);
      return LogEntry.__super__.constructor.apply(this, arguments);
    }

    LogEntry.prototype.className = 'log-entry';

    LogEntry.prototype.classNameSmall = 'log-entry';

    LogEntry.prototype.tagName = 'li';

    LogEntry.prototype.template = Handlebars.templates['log-entry-template'];

    LogEntry.prototype.template_small = Handlebars.templates['log-entry-small_template'];

    LogEntry.prototype.log_single_value_template = Handlebars.templates['log-single_value-template'];

    LogEntry.prototype.log_machines_values_template = Handlebars.templates['log-machines_values-template'];

    LogEntry.prototype.log_datacenters_values_template = Handlebars.templates['log-datacenters_values-template'];

    LogEntry.prototype.log_shards_values_template = Handlebars.templates['log-shards_values-template'];

    LogEntry.prototype.log_shards_list_values_template = Handlebars.templates['log-shards_list_values-template'];

    LogEntry.prototype.log_shard_names_values_template = Handlebars.templates['log-shard_names_values-template'];

    LogEntry.prototype.log_new_namespace_template = Handlebars.templates['log-new_namespace-template'];

    LogEntry.prototype.log_new_datacenter_template = Handlebars.templates['log-new_datacenter-template'];

    LogEntry.prototype.log_new_database_template = Handlebars.templates['log-new_database-template'];

    LogEntry.prototype.log_delete_something_template = Handlebars.templates['log-delete_something-template'];

    LogEntry.prototype.log_namespace_new_name_template = Handlebars.templates['log-namespace-new_name-template'];

    LogEntry.prototype.log_server_new_name_template = Handlebars.templates['log-server-new_name-template'];

    LogEntry.prototype.log_server_set_datacenter_template = Handlebars.templates['log-server-set_datacenter-template'];

    LogEntry.prototype.log_datacenter_new_name_template = Handlebars.templates['log-datacenter-new_name-template'];

    LogEntry.prototype.log_database_new_name_template = Handlebars.templates['log-database-new_name-template'];

    LogEntry.prototype.log_new_something_small_template = Handlebars.templates['log-new_something-small_template'];

    LogEntry.prototype.log_new_datacenter_small_template = Handlebars.templates['log-new_datacenter-small_template'];

    LogEntry.prototype.log_new_database_small_template = Handlebars.templates['log-new_database-small_template'];

    LogEntry.prototype.log_namespace_value_small_template = Handlebars.templates['log-namespace_value-small_template'];

    LogEntry.prototype.log_machine_value_small_template = Handlebars.templates['log-machine_value-small_template'];

    LogEntry.prototype.log_datacenter_value_small_template = Handlebars.templates['log-datacenter_value-small_template'];

    LogEntry.prototype.log_database_value_small_template = Handlebars.templates['log-database_value-small_template'];

    LogEntry.prototype.events = {
      'click .more-details-link': 'display_details'
    };

    LogEntry.prototype.display_details = function(event) {
      var found_hide_details_link, found_more_details_link;
      event.preventDefault();
      if (this.$(event.target).html() === 'More details') {
        this.$(event.target).html('Hide details');
        this.$(event.target).parent().parent().next().next().slideDown('fast');
        found_more_details_link = false;
        $('.more-details-link').each(function() {
          if ($(this).html() === 'More details') {
            found_more_details_link = true;
            return false;
          }
        });
        if (found_more_details_link === false) {
          return $('.expand_all_link').html('Hide all details');
        }
      } else {
        this.$(event.target).html('More details');
        this.$(event.target).parent().parent().next().next().slideUp('fast');
        found_hide_details_link = false;
        $('.more-details-link').each(function() {
          if ($(this).html() === 'Hide details') {
            found_hide_details_link = true;
            return false;
          }
        });
        if (found_hide_details_link === false) {
          return $('.expand_all_link').html('Show all details');
        }
      }
    };

    LogEntry.prototype.render = function(compact) {
      var json;
      if (compact) {
        json = _.extend(this.model.toJSON(), this.format_msg_small(this.model));
      } else {
        json = _.extend(this.model.toJSON(), this.format_msg(this.model));
      }
      json = _.extend(json, {
        machine_name: machines.get(this.model.get('machine_uuid')) != null ? machines.get(this.model.get('machine_uuid')).get('name') : 'Unknown machine',
        datetime: new XDate(this.model.get('timestamp') * 1000).toString("HH:mm - MMMM dd, yyyy")
      });
      if (compact) {
        this.$el.html(this.template_small(json));
        this.$el.attr('class', this.classNameSmall);
      } else {
        this.$el.html(this.template(json));
      }
      this.delegateEvents();
      return this;
    };

    LogEntry.prototype.pattern_applying_data = /^(Applying data {)/;

    LogEntry.prototype.format_msg = function(model) {
      var attribute, attributes, data, database_id, datacenter_id, datacenter_name, group, json_data, machine_id, msg, namespace_id, raw_data, shard, shard_string, shards, value, _datacenters, _i, _j, _len, _len1, _machines, _ref, _ref1, _ref2;
      msg = model.get('message');
      if (this.pattern_applying_data.test(msg)) {
        data = msg.slice(14);
        data = DataUtils.stripslashes(data);
        msg = '';
        json_data = $.parseJSON(data);
        for (group in json_data) {
          if (group === 'rdb_namespaces') {
            for (namespace_id in json_data[group]) {
              if (namespace_id === 'new') {
                if (datacenters.get(json_data[group]['new']['primary_uuid']) != null) {
                  datacenter_name = datacenters.get(json_data[group]['new']['primary_uuid']).get('name');
                } else if (json_data[group]['new']['primary_uuid'] === universe_datacenter.get('id')) {
                  datacenter_name = universe_datacenter.get('name');
                } else {
                  datacenter_name = 'a removed datacenter';
                }
                msg += this.log_new_namespace_template({
                  namespace_name: json_data[group]['new']['name'],
                  datacenter_id: json_data[group]['new']['primary_uuid'],
                  datacenter_name: datacenter_name,
                  is_universe: json_data[group]['new']['primary_uuid'] === universe_datacenter.get('id')
                });
              } else {
                if (json_data[group][namespace_id] === null) {
                  msg += this.log_delete_something_template({
                    type: 'table',
                    id: namespace_id
                  });
                } else {
                  attributes = [];
                  for (attribute in json_data[group][namespace_id]) {
                    if (attribute === 'ack_expectations' || attribute === 'replica_affinities') {
                      _datacenters = [];
                      for (datacenter_id in json_data[group][namespace_id][attribute]) {
                        if (datacenter_id === universe_datacenter.get('id')) {
                          datacenter_name = universe_datacenter.get('name');
                        } else if (((_ref = datacenters.get(datacenter_id)) != null ? _ref.get('name') : void 0) != null) {
                          datacenter_name = datacenters.get(datacenter_id).get('name');
                        } else {
                          datacenter_name = 'a removed datacenter';
                        }
                        if (attribute === 'ack_expectations') {
                          value = json_data[group][namespace_id][attribute][datacenter_id].expectation;
                        } else {
                          value = json_data[group][namespace_id][attribute][datacenter_id];
                        }
                        data = {
                          is_universe: datacenter_id === universe_datacenter.get('id'),
                          datacenter_id: datacenter_id,
                          datacenter_name: datacenter_name,
                          value: value
                        };
                        _datacenters.push(data);
                      }
                      msg += this.log_datacenters_values_template({
                        namespace_id: namespace_id,
                        namespace_name: namespaces.get(namespace_id) != null ? namespaces.get(namespace_id).get('name') : '[table no longer exists]',
                        namespace_exists: namespaces.get(namespace_id) != null,
                        attribute: attribute,
                        datacenters: _datacenters
                      });
                    } else if (attribute === 'name') {
                      msg += this.log_namespace_new_name_template({
                        name: json_data[group][namespace_id][attribute],
                        namespace_id: namespace_id,
                        namespace_id_trunked: namespace_id.slice(24),
                        namespace_exists: namespaces.get(namespace_id) != null,
                        attribute: attribute,
                        value: json_data[group][namespace_id][attribute]
                      });
                    } else if (attribute === 'primary_uuid') {
                      datacenter_id = json_data[group][namespace_id][attribute];
                      if (datacenter_id === universe_datacenter.get('id')) {
                        datacenter_name = universe_datacenter.get('name');
                      } else if (datacenters.get(datacenter_id) != null) {
                        datacenter_name = datacenters.get(datacenter_id).get('name');
                      } else {
                        datacenter_name = 'a removed datacenter';
                      }
                      msg += this.log_single_value_template({
                        namespace_id: namespace_id,
                        namespace_name: namespaces.get(namespace_id) != null ? namespaces.get(namespace_id).get('name') : '[table no longer exists]',
                        namespace_exists: namespaces.get(namespace_id) != null,
                        attribute: 'primary datacenter',
                        datacenter_id: datacenter_id,
                        datacenter_name: datacenter_name
                      });
                    } else if (attribute === 'primary_pinnings') {
                      shards = [];
                      for (shard in json_data[group][namespace_id][attribute]) {
                        if (json_data[group][namespace_id][attribute][shard] != null) {
                          shards.push({
                            shard: shard,
                            machine_id: json_data[group][namespace_id][attribute][shard],
                            machine_name: machines.get(json_data[group][namespace_id][attribute][shard]) != null ? machines.get(json_data[group][namespace_id][attribute][shard]).get('name') : '[machine no longer exists]',
                            machine_exists: machines.get(json_data[group][namespace_id][attribute][shard]) != null
                          });
                        } else {
                          shards.push({
                            shard: shard,
                            is_null: true
                          });
                        }
                      }
                      msg += this.log_shards_values_template({
                        namespace_id: namespace_id,
                        namespace_name: namespaces.get(namespace_id) != null ? namespaces.get(namespace_id).get('name') : '[table no longer exists]',
                        namespace_exists: namespaces.get(namespace_id) != null,
                        attribute: attribute,
                        shards: shards
                      });
                    } else if (attribute === 'secondary_pinnings') {
                      shards = [];
                      for (shard in json_data[group][namespace_id][attribute]) {
                        _machines = [];
                        _ref1 = json_data[group][namespace_id][attribute][shard];
                        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
                          machine_id = _ref1[_i];
                          if (machine_id != null) {
                            _machines.push({
                              id: machine_id,
                              name: machines.get(machine_id) != null ? machines.get(machine_id).get('name') : '[machine no longer exists]',
                              exists: machines.get(machine_id) != null
                            });
                          }
                        }
                        shards.push({
                          shard: shard,
                          machines: _machines
                        });
                      }
                      msg += this.log_shards_list_values_template({
                        namespace_id: namespace_id,
                        namespace_name: namespaces.get(namespace_id) != null ? namespaces.get(namespace_id).get('name') : '[table no longer exists]',
                        namespace_exists: namespaces.get(namespace_id) != null,
                        attribute: attribute,
                        shards: shards
                      });
                    } else if (attribute === 'shards') {
                      value = [];
                      _ref2 = json_data[group][namespace_id][attribute];
                      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
                        shard_string = _ref2[_j];
                        value.push(JSON.parse(shard_string));
                      }
                      msg += this.log_shard_names_values_template({
                        namespace_id: namespace_id,
                        namespace_name: namespaces.get(namespace_id) != null ? namespaces.get(namespace_id).get('name') : '[table no longer exists]',
                        namespace_exists: namespaces.get(namespace_id) != null,
                        attribute: attribute,
                        shards: _.map(value, function(shard) {
                          return JSON.stringify(shard).replace(/\\"/g, '"');
                        }),
                        value: JSON.stringify(value).replace(/\\"/g, '"')
                      });
                    }
                  }
                }
              }
            }
          } else if (group === 'machines') {
            for (machine_id in json_data[group]) {
              if (json_data[group][machine_id] === null) {
                msg += this.log_delete_something_template({
                  type: 'machine',
                  id: machine_id
                });
              } else {
                for (attribute in json_data[group][machine_id]) {
                  if (attribute === 'name') {
                    msg += this.log_server_new_name_template({
                      name: json_data[group][machine_id][attribute],
                      machine_id: machine_id,
                      machine_id_trunked: machine_id.slice(24)
                    });
                  } else if (attribute === 'datacenter_uuid') {
                    datacenter_id = json_data[group][machine_id][attribute];
                    if (datacenter_id === universe_datacenter.get('id')) {
                      datacenter_name = universe_datacenter.get('name');
                    } else if (datacenters.get(datacenter_id) != null) {
                      datacenter_name = datacenters.get(datacenter_id).get('name');
                    } else {
                      datacenter_name = 'a removed datacenter';
                    }
                    msg += this.log_server_set_datacenter_template({
                      machine_id: machine_id,
                      machine_name: machines.get(machine_id) != null ? machines.get(machine_id).get('name') : '[machine no longer exists]',
                      machine_exists: machines.get(machine_id) != null,
                      datacenter_id: datacenter_id,
                      datacenter_name: datacenter_name
                    });
                  }
                }
              }
            }
          } else if (group === 'datacenters') {
            for (datacenter_id in json_data[group]) {
              if (json_data[group][datacenter_id] === null) {
                msg += this.log_delete_something_template({
                  type: 'datacenter',
                  id: datacenter_id
                });
              } else if (datacenter_id === 'new') {
                msg += this.log_new_datacenter_template({
                  datacenter_name: json_data[group][datacenter_id]['name']
                });
              } else {
                for (attribute in json_data[group][datacenter_id]) {
                  if (attribute === 'name') {
                    msg += this.log_datacenter_new_name_template({
                      name: json_data[group][datacenter_id][attribute],
                      datacenter_id: datacenter_id,
                      datacenter_id_trunked: datacenter_id.slice(24)
                    });
                  }
                }
              }
            }
          } else if (group === 'databases') {
            for (database_id in json_data[group]) {
              if (json_data[group][database_id] === null) {
                msg += this.log_delete_something_template({
                  type: 'database',
                  id: database_id
                });
              } else if (database_id === 'new') {
                msg += this.log_new_database_template({
                  database_name: json_data[group][database_id]['name']
                });
              } else {
                for (attribute in json_data[group][database_id]) {
                  if (attribute === 'name') {
                    msg += this.log_database_new_name_template({
                      name: json_data[group][database_id][attribute],
                      database_id: database_id,
                      database_id_trunked: database_id.slice(24)
                    });
                  }
                }
              }
            }
          } else {
            msg += "We were unable to parse this log. Click on 'More details' to see the raw log data.";
            raw_data = JSON.stringify($.parseJSON(data), void 0, 2);
          }
        }
        return {
          msg: msg,
          raw_data: (raw_data != null ? raw_data : void 0)
        };
      } else {
        return {
          msg: msg
        };
      }
    };

    LogEntry.prototype.format_msg_small = function(model) {
      var attribute, attributes, data, database_id, datacenter_id, datacenter_name, group, i, json_data, machine_id, msg, namespace_id, value, _i, _j, _k, _l, _len, _len1, _len2, _len3;
      msg = model.get('message');
      if (this.pattern_applying_data.test(msg)) {
        data = msg.slice(14);
        data = DataUtils.stripslashes(data);
        msg = '';
        json_data = $.parseJSON(data);
        for (group in json_data) {
          if (group === 'rdb_namespaces') {
            for (namespace_id in json_data[group]) {
              if (json_data[group][namespace_id] === null) {
                msg += this.log_delete_something_template({
                  type: 'table',
                  id: namespace_id
                });
              } else if (namespace_id === 'new') {
                msg += this.log_new_something_small_template({
                  type: 'table'
                });
              } else {
                attributes = [];
                for (attribute in json_data[group][namespace_id]) {
                  attributes.push(attribute);
                }
                value = '';
                for (i = _i = 0, _len = attributes.length; _i < _len; i = ++_i) {
                  attribute = attributes[i];
                  value += attribute;
                  if (i !== attributes.length - 1) {
                    value += ', ';
                  }
                }
                msg += this.log_namespace_value_small_template({
                  namespace_id: namespace_id,
                  namespace_name: namespaces.get(namespace_id) != null ? namespaces.get(namespace_id).get('name') : '[table no longer exists]',
                  namespace_exists: namespaces.get(namespace_id) != null,
                  attribute: value
                });
              }
            }
          } else if (group === 'machines') {
            for (machine_id in json_data[group]) {
              for (attribute in json_data[group][machine_id]) {
                attributes = [];
                for (attribute in json_data[group][machine_id]) {
                  attributes.push(attribute);
                }
                value = '';
                for (i = _j = 0, _len1 = attributes.length; _j < _len1; i = ++_j) {
                  attribute = attributes[i];
                  value += attribute;
                  if (i !== attributes.length - 1) {
                    value += ', ';
                  }
                }
                msg += this.log_machine_value_small_template({
                  machine_id: machine_id,
                  machine_name: machines.get(machine_id) != null ? machines.get(machine_id).get('name') : '[machine no longer exists]',
                  machine_exists: machines.get(machine_id) != null,
                  attribute: value
                });
              }
            }
          } else if (group === 'datacenters') {
            for (datacenter_id in json_data[group]) {
              if (json_data[group][datacenter_id] === null) {
                msg += this.log_delete_something_template({
                  type: 'datacenter',
                  id: datacenter_id
                });
              } else if (datacenter_id === 'new') {
                msg += this.log_new_something_small_template({
                  type: 'datacenter'
                });
              } else {
                for (attribute in json_data[group][datacenter_id]) {
                  attributes = [];
                  for (attribute in json_data[group][datacenter_id]) {
                    attributes.push(attribute);
                  }
                  value = '';
                  for (i = _k = 0, _len2 = attributes.length; _k < _len2; i = ++_k) {
                    attribute = attributes[i];
                    value += attribute;
                    if (i !== attributes.length - 1) {
                      value += ', ';
                    }
                  }
                  if (datacenter_id === universe_datacenter.get('id')) {
                    datacenter_name = universe_datacenter.get('name');
                  } else if (datacenters.get(datacenter_id) != null) {
                    datacenter_name = datacenters.get(datacenter_id).get('name');
                  } else {
                    datacenter_name = 'a removed datacenter';
                  }
                  msg += this.log_datacenter_value_small_template({
                    datacenter_id: datacenter_id,
                    datacenter_name: datacenter_name,
                    attribute: value
                  });
                }
              }
            }
          } else if (group === 'databases') {
            for (database_id in json_data[group]) {
              if (json_data[group][database_id] === null) {
                msg += this.log_delete_something_template({
                  type: 'database',
                  id: database_id
                });
              } else if (database_id === 'new') {
                msg += this.log_new_something_small_template({
                  type: 'database'
                });
              } else {
                for (attribute in json_data[group][database_id]) {
                  attributes = [];
                  for (attribute in json_data[group][database_id]) {
                    attributes.push(attribute);
                  }
                  value = '';
                  for (i = _l = 0, _len3 = attributes.length; _l < _len3; i = ++_l) {
                    attribute = attributes[i];
                    value += attribute;
                    if (i !== attributes.length - 1) {
                      value += ', ';
                    }
                  }
                  msg += this.log_database_value_small_template({
                    database_id: database_id,
                    database_name: databases.get(database_id) != null ? databases.get(database_id).get('name') : 'removed database',
                    database_exists: databases.get(database_id) != null,
                    attribute: value
                  });
                }
              }
            }
          } else {
            msg += "We were unable to parse this log. Click on 'More details' to see the raw log";
          }
        }
        return {
          msg: msg,
          raw_data: JSON.stringify($.parseJSON(data), void 0, 2),
          timeago_timestamp: this.model.get_iso_8601_timestamp()
        };
      } else {
        return {
          msg: msg,
          timeago_timestamp: this.model.get_iso_8601_timestamp()
        };
      }
    };

    return LogEntry;

  })(Backbone.View);
});

module('Vis', function() {
  this.num_formatter = function(i) {
    var res;
    if (isNaN(i)) {
      return 'N/A';
    }
    if (i / 1000000000 >= 1) {
      res = '' + ((i / 1000000000).toFixed(1));
      if (res.slice(-2) === '.0') {
        res = res.slice(0, -2);
      }
      res += 'B';
    } else if (i / 1000000 >= 1) {
      res = '' + ((i / 1000000).toFixed(1));
      if (res.slice(-2) === '.0') {
        res = res.slice(0, -2);
      }
      res += 'M';
    } else if (i / 1000 >= 1) {
      res = '' + ((i / 1000).toFixed(1));
      if (res.slice(-2) === '.0') {
        res = res.slice(0, -2);
      }
      res += 'K';
    } else {
      res = '' + i.toFixed(0);
    }
    return res;
  };
  this.OpsPlotLegend = (function(_super) {

    __extends(OpsPlotLegend, _super);

    function OpsPlotLegend() {
      this.destroy = __bind(this.destroy, this);

      this.initialize = __bind(this.initialize, this);
      return OpsPlotLegend.__super__.constructor.apply(this, arguments);
    }

    OpsPlotLegend.prototype.className = 'ops-plot-legend';

    OpsPlotLegend.prototype.template = Handlebars.templates['ops_plot_legend-template'];

    OpsPlotLegend.prototype.initialize = function(_read_metric, _write_metric, _context) {
      var _this = this;
      log_initial('(initializing) ops plot legend');
      this.context = _context;
      this.reads = null;
      this.writes = null;
      this.read_metric = _read_metric;
      return this.read_metric.on('change', function() {
        _this.reads = _read_metric.valueAt(_this.context.size() - 1);
        _this.writes = _write_metric.valueAt(_this.context.size() - 1);
        return _this.render();
      });
    };

    OpsPlotLegend.prototype.render = function() {
      log_render('(rendering) ops plot legend');
      this.$el.html(this.template({
        read_count: this.reads != null ? Vis.num_formatter(this.reads) : 'N/A',
        write_count: this.writes != null ? Vis.num_formatter(this.writes) : 'N/A'
      }));
      return this;
    };

    OpsPlotLegend.prototype.destroy = function() {
      this.context.stop();
      return this.read_metric.on('change');
    };

    return OpsPlotLegend;

  })(Backbone.View);
  this.OpsPlot = (function(_super) {

    __extends(OpsPlot, _super);

    function OpsPlot() {
      this.destroy = __bind(this.destroy, this);

      this.render = __bind(this.render, this);

      this.make_metric = __bind(this.make_metric, this);
      return OpsPlot.__super__.constructor.apply(this, arguments);
    }

    OpsPlot.prototype.className = 'ops-plot';

    OpsPlot.prototype.template = Handlebars.templates['ops_plot-template'];

    OpsPlot.prototype.barebones_template = Handlebars.templates['ops_plot-template'];

    OpsPlot.prototype.type = 'cluster';

    OpsPlot.prototype.HEIGHT_IN_PIXELS = 200;

    OpsPlot.prototype.HEIGHT_IN_UNITS = 20500;

    OpsPlot.prototype.WIDTH_IN_PIXELS = 300;

    OpsPlot.prototype.WIDTH_IN_SECONDS = 60;

    OpsPlot.prototype.HAXIS_TICK_INTERVAL_IN_SECS = 15;

    OpsPlot.prototype.HAXIS_MINOR_SUBDIVISION_COUNT = 3;

    OpsPlot.prototype.VAXIS_TICK_SUBDIVISION_COUNT = 5;

    OpsPlot.prototype.VAXIS_MINOR_SUBDIVISION_COUNT = 2;

    OpsPlot.prototype.make_metric = function(name) {
      var cache, _metric,
        _this = this;
      cache = new Vis.InterpolatingCache(this.WIDTH_IN_PIXELS, this.WIDTH_IN_PIXELS / this.WIDTH_IN_SECONDS, (function() {
        return _this.stats_fn()[name];
      }));
      _metric = function(start, stop, step, callback) {
        var num_desired;
        start = +start;
        stop = +stop;
        num_desired = (stop - start) / step;
        return callback(null, cache.step(num_desired));
      };
      this.context.on('focus', function(i) {
        return d3.selectAll('.value').style('right', i === null ? null : _this.context.size() - i + 'px');
      });
      return this.context.metric(_metric, name);
    };

    OpsPlot.prototype.initialize = function(_stats_fn, options) {
      log_initial('(initializing) ops plot');
      if (options != null) {
        if (options.height != null) {
          this.HEIGHT_IN_PIXELS = options.height;
        }
        if (options.height_in_units != null) {
          this.HEIGHT_IN_UNITS = options.height_in_units;
        }
        if (options.width != null) {
          this.WIDTH_IN_PIXELS = options.width;
        }
        if (options.seconds != null) {
          this.WIDTH_IN_SECONDS = options.seconds;
        }
        if (options.haxis != null) {
          if (options.haxis.seconds_per_tick != null) {
            this.HAXIS_TICK_INTERVAL_IN_SECS = options.haxis.seconds_per_tick;
          }
          if (options.haxis.ticks_per_label != null) {
            this.HAXIS_MINOR_SUBDIVISION_COUNT = options.haxis.ticks_per_label;
          }
        }
        if (options.vaxis != null) {
          if (options.vaxis.num_ticks != null) {
            this.VAXIS_TICK_SUBDIVISION_COUNT = options.vaxis.num_ticks;
          }
          if (options.vaxis.ticks_per_label != null) {
            this.VAXIS_MINOR_SUBDIVISION_COUNT = options.vaxis.ticks_per_label;
          }
        }
        if (options.type != null) {
          this.type = options.type;
        }
      }
      OpsPlot.__super__.initialize.apply(this, arguments);
      this.stats_fn = _stats_fn;
      this.context = cubism.context().serverDelay(0).clientDelay(0).step(1000 / (this.WIDTH_IN_PIXELS / this.WIDTH_IN_SECONDS)).size(this.WIDTH_IN_PIXELS);
      this.read_stats = this.make_metric('keys_read');
      this.write_stats = this.make_metric('keys_set');
      return this.legend = new Vis.OpsPlotLegend(this.read_stats, this.write_stats, this.context);
    };

    OpsPlot.prototype.render = function() {
      var _this = this;
      log_render('(rendering) ops plot');
      this.$el.html(this.template({
        cluster: this.type === 'cluster',
        datacenter: this.type === 'datacenter',
        server: this.type === 'server',
        database: this.type === 'database',
        table: this.type === 'table'
      }));
      this.sensible_plot = this.context.sensible().height(this.HEIGHT_IN_PIXELS).colors(["#983434", "#729E51"]).extent([0, this.HEIGHT_IN_UNITS]);
      d3.select(this.$('.plot')[0]).call(function(div) {
        div.data([[_this.read_stats, _this.write_stats]]);
        _this.selection = div.append('div').attr('class', 'chart');
        _this.selection.call(_this.sensible_plot);
        div.append('div').attr('class', 'haxis').call(_this.context.axis().orient('bottom').ticks(d3.time.seconds, _this.HAXIS_TICK_INTERVAL_IN_SECS).tickSubdivide(_this.HAXIS_MINOR_SUBDIVISION_COUNT - 1).tickSize(6, 3, 0).tickFormat(d3.time.format('%I:%M:%S')));
        div.append('div').attr('class', 'hgrid').call(_this.context.axis().orient('bottom').ticks(d3.time.seconds, _this.HAXIS_TICK_INTERVAL_IN_SECS).tickSize(_this.HEIGHT_IN_PIXELS + 4, 0, 0).tickFormat(""));
        div.append('div').attr('class', 'vaxis').call(_this.context.axis(_this.HEIGHT_IN_PIXELS, [_this.read_stats, _this.write_stats], _this.sensible_plot.scale()).orient('left').ticks(_this.VAXIS_TICK_SUBDIVISION_COUNT).tickSubdivide(_this.VAXIS_MINOR_SUBDIVISION_COUNT - 1).tickSize(6, 3, 0).tickFormat(Vis.num_formatter));
        div.append('div').attr('class', 'vgrid').call(_this.context.axis(_this.HEIGHT_IN_PIXELS, [_this.read_stats, _this.write_stats], _this.sensible_plot.scale()).orient('left').ticks(_this.VAXIS_TICK_SUBDIVISION_COUNT).tickSize(-(_this.WIDTH_IN_PIXELS + 35), 0, 0).tickFormat(""));
        return _this.$('.legend-container').html(_this.legend.render().el);
      });
      return this;
    };

    OpsPlot.prototype.destroy = function() {
      this.sensible_plot.remove(this.selection);
      this.context.on('focus');
      return this.legend.destroy();
    };

    return OpsPlot;

  })(Backbone.View);
  this.SizeBoundedCache = (function() {

    function SizeBoundedCache(num_data_points, _stat) {
      this.values = [];
      this.ndp = num_data_points;
      this.stat = _stat;
    }

    SizeBoundedCache.prototype.push = function(stats) {
      var i, value, _i, _ref, _ref1;
      if (typeof this.stat === 'function') {
        value = this.stat(stats);
      } else {
        if (stats != null) {
          value = stats[this.stat];
        }
      }
      if (isNaN(value)) {
        return;
      }
      this.values.push(value);
      if (this.values.length < this.ndp) {
        for (i = _i = _ref = this.values.length, _ref1 = this.ndp - 1; _ref <= _ref1 ? _i < _ref1 : _i > _ref1; i = _ref <= _ref1 ? ++_i : --_i) {
          this.values.push(value);
        }
      }
      if (this.values.length > this.ndp) {
        return this.values = this.values.slice(-this.ndp);
      }
    };

    SizeBoundedCache.prototype.get = function() {
      return this.values;
    };

    SizeBoundedCache.prototype.get_latest = function() {
      return this.values[this.values.length - 1];
    };

    return SizeBoundedCache;

  })();
  return this.InterpolatingCache = (function() {

    function InterpolatingCache(num_data_points, num_interpolation_points, get_data_fn) {
      var i, _i, _ref;
      this.ndp = num_data_points;
      this.nip = num_interpolation_points;
      this.get_data_fn = get_data_fn;
      this.values = [];
      for (i = _i = 0, _ref = this.ndp - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; i = 0 <= _ref ? ++_i : --_i) {
        this.values.push(0);
      }
      this.next_value = null;
      this.last_date = null;
    }

    InterpolatingCache.prototype.step = function(num_points) {
      this.push_data();
      return this.values.slice(-num_points);
    };

    InterpolatingCache.prototype.push_data = function() {
      var current_value, elapsed_time, i, missing_steps, value_to_push, _i;
      if (this.last_date === null) {
        this.last_date = Date.now();
        this.values.push(this.get_data_fn());
        return true;
      }
      current_value = this.get_data_fn();
      if (this.next_value !== current_value) {
        this.start_value = this.values[this.values.length - 1];
        this.next_value = current_value;
        this.interpolation_step = 1;
      }
      elapsed_time = Date.now() - this.last_date;
      missing_steps = Math.max(1, Math.round(elapsed_time / 1000 * this.nip));
      for (i = _i = 1; 1 <= missing_steps ? _i <= missing_steps : _i >= missing_steps; i = 1 <= missing_steps ? ++_i : --_i) {
        if (this.values[this.values.length - 1] === this.next_value) {
          value_to_push = this.next_value;
        } else {
          value_to_push = this.start_value + ((this.next_value - this.start_value) / this.nip * this.interpolation_step);
          this.interpolation_step += 1;
          if (this.interpolation_step > this.nip) {
            value_to_push = this.next_value;
          }
        }
        this.values.push(value_to_push);
      }
      this.last_date = Date.now();
      if (this.values.length > this.ndp) {
        return this.values = this.values.slice(-this.ndp);
      }
    };

    return InterpolatingCache;

  })();
});

Database = (function(_super) {

  __extends(Database, _super);

  function Database() {
    this.get_stats_for_performance = __bind(this.get_stats_for_performance, this);

    this.get_namespaces = __bind(this.get_namespaces, this);
    return Database.__super__.constructor.apply(this, arguments);
  }

  Database.prototype.get_namespaces = function() {
    var namespace, namespaces_in_datacenter, _i, _len, _ref;
    namespaces_in_datacenter = [];
    _ref = namespaces.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      namespace = _ref[_i];
      if (namespace.get('database') === this.get('id')) {
        namespaces_in_datacenter.push(namespace);
      }
    }
    return namespaces_in_datacenter;
  };

  Database.prototype.get_stats_for_performance = function() {
    var namespace, __s, _i, _len, _ref, _s;
    __s = {
      keys_read: 0,
      keys_set: 0
    };
    _ref = namespaces.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      namespace = _ref[_i];
      if (namespace.get('database') === this.get('id')) {
        _s = namespace.get_stats();
        if (!(_s != null)) {
          continue;
        }
        __s.keys_read += _s.keys_read;
        __s.keys_set += _s.keys_set;
      }
    }
    return __s;
  };

  return Database;

})(Backbone.Model);

Namespace = (function(_super) {

  __extends(Namespace, _super);

  function Namespace() {
    this.get_durability = __bind(this.get_durability, this);

    this.get_stats_for_performance = __bind(this.get_stats_for_performance, this);

    this.get_stats = __bind(this.get_stats, this);

    this.splitpoint_between = __bind(this.splitpoint_between, this);

    this.compute_shard_rows_approximation = __bind(this.compute_shard_rows_approximation, this);

    this.clear_timeout = __bind(this.clear_timeout, this);

    this.load_key_distr = __bind(this.load_key_distr, this);

    this.compare_keys = __bind(this.compare_keys, this);

    this.compute_shards = __bind(this.compute_shards, this);
    return Namespace.__super__.constructor.apply(this, arguments);
  }

  Namespace.prototype.initialize = function() {
    return this.compute_shards();
  };

  Namespace.prototype.compute_shards = function() {
    return this.set('computed_shards', new DataUtils.Shards([], this));
  };

  Namespace.prototype.regex = {
    string: /^S/,
    number: /^N.*%23(\-?[0-9]*(\.)?[0-9]*$)/,
    date: /^(PTIME).*%23\-?([0-9]*(\.)?[0-9]*$)/
  };

  Namespace.prototype.transform_key = function(a) {
    var a_new, s;
    if (a === null) {
      a_new = a;
    } else if (a === "") {
      a_new = -Infinity;
    } else if (typeof a === "string") {
      if (this.regex.string.test(a) === true) {
        a_new = a.slice(1);
      } else if (this.regex.number.test(a) === true) {
        s = a.slice(a.indexOf("%23") + 3);
        if (_.isNaN(parseFloat(s)) === false) {
          a_new = parseFloat(s);
        }
      } else if (this.regex.date.test(a) === true) {
        a_new = new Date(parseFloat(a.slice(a.indexOf("%23") + 3)));
      }
    }
    return a_new;
  };

  Namespace.prototype.compare_keys = function(a, b) {
    var a_new, b_new;
    a_new = this.transform_key(a);
    b_new = this.transform_key(b);
    if (typeof a_new === 'number' && typeof b_new === 'number') {
      return a_new - b_new;
    } else if ((typeof a_new === 'string' && typeof b_new === 'string') || (a_new instanceof Date && b_new instanceof Date)) {
      if (a_new > b_new) {
        return 1;
      } else if (a_new < b_new) {
        return -1;
      } else {
        return 0;
      }
    } else if (typeof a_new !== typeof b_new) {
      if (typeof a_new === 'number' && typeof b_new === 'string') {
        return -1;
      } else if (typeof a_new === 'number' && b_new instanceof Date) {
        return -1;
      } else if (a_new instanceof Date && typeof b_new === 'string') {
        return -1;
      } else if (typeof a_new === 'string' && typeof b_new === 'number') {
        return 1;
      } else if (a_new instanceof Date && typeof b_new === 'number') {
        return 1;
      } else if (typeof a_new === 'string' && b_new instanceof Date) {
        return 1;
      } else if (a_new === null && b_new !== null) {
        return 1;
      } else if (b_new === null && a_new !== null) {
        return -1;
      }
    }
    return 0;
  };

  Namespace.prototype.load_key_distr = function() {
    var _this = this;
    return $.ajax({
      processData: false,
      url: "ajax/distribution?namespace=" + (this.get('id')) + "&depth=2",
      type: 'GET',
      contentType: 'application/json',
      success: function(distr_data) {
        var count, distr_keys, key;
        distr_keys = [];
        for (key in distr_data) {
          count = distr_data[key];
          distr_keys.push(key);
        }
        distr_keys.sort(_this.compare_keys);
        _this.set('key_distr_sorted', distr_keys);
        _this.set('key_distr', distr_data);
        return _this.timeout = setTimeout(_this.load_key_distr, 5000);
      },
      error: function() {
        if (namespaces.get(_this.get('id')) != null) {
          return _this.timeout = setTimeout(_this.load_key_distr, 1000);
        }
      }
    });
  };

  Namespace.prototype.clear_timeout = function() {
    if (this.timeout != null) {
      return clearTimeout(this.timeout);
    }
  };

  Namespace.prototype.compute_shard_rows_approximation = function(shard) {
    var count, end_key, key, start_key, _i, _len, _ref;
    shard = $.parseJSON(shard);
    if (!(this.get('key_distr') != null) || !(this.get('key_distr_sorted') != null)) {
      return null;
    }
    start_key = shard[0];
    end_key = shard[1];
    count = 0;
    _ref = this.get('key_distr_sorted');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      key = _ref[_i];
      if (this.compare_keys(key, start_key) >= 0 || start_key === '') {
        if (this.compare_keys(key, end_key) < 0 || end_key === null) {
          if (this.get('key_distr')[key] != null) {
            count += this.get('key_distr')[key];
          }
        }
      }
    }
    return count.toString();
  };

  Namespace.prototype.splitpoint_between = function(shard_index, sp) {
    var all_sps;
    all_sps = this.get('splitpoints');
    return (shard_index === 0 || all_sps[shard_index - 1] < sp) && (shard_index === all_sps.length || sp < all_sps[shard_index]);
  };

  Namespace.prototype.get_stats = function() {
    var __s,
      _this = this;
    __s = {
      keys_read: 0,
      keys_set: 0
    };
    _.each(DataUtils.get_namespace_machines(this.get('id')), function(mid) {
      var keys_read, keys_set, serializer, serializer_id, _m, _results, _s;
      _m = machines.get(mid);
      if (_m != null) {
        _s = _m.get_stats()[_this.get('id')];
      }
      if ((_s != null ? _s.serializers : void 0) != null) {
        keys_read = 0;
        keys_set = 0;
        _results = [];
        for (serializer_id in _s.serializers) {
          serializer = _s.serializers[serializer_id];
          if (serializer['btree-primary'] != null) {
            keys_read = parseFloat(serializer['btree-primary'].keys_read);
            keys_set = parseFloat(serializer['btree-primary'].keys_set);
            if (!isNaN(keys_read)) {
              __s.keys_read += keys_read;
            }
            if (!isNaN(keys_set)) {
              _results.push(__s.keys_set += keys_set);
            } else {
              _results.push(void 0);
            }
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    });
    return __s;
  };

  Namespace.prototype.get_stats_for_performance = function() {
    var machine, num_machines_in_namespace, __s, _i, _len, _ref, _s;
    __s = {
      keys_read: 0,
      keys_set: 0,
      global_disk_space: 0
    };
    _s = this.get_stats();
    if (_s != null) {
      __s.keys_read += _s.keys_read;
      __s.keys_set += _s.keys_set;
    }
    num_machines_in_namespace = 0;
    _ref = machines.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      machine = _ref[_i];
      if ((machine.get('stats') != null) && this.get('id') in machine.get('stats') && machine.is_reachable) {
        num_machines_in_namespace++;
        __s.global_disk_space += machine.get_used_disk_space();
      }
    }
    return __s;
  };

  Namespace.prototype.get_durability = function() {
    var ack, dc, _ref;
    if (this.get('hard_durability') != null) {
      return this.get('hard_durability');
    } else {
      _ref = this.get('ack_expectations');
      for (dc in _ref) {
        ack = _ref[dc];
        this.set('hard_durability', ack.hard_durability);
        return this.get('hard_durability');
      }
      this.set('hard_durability', true);
      return this.get('hard_durability');
    }
  };

  return Namespace;

})(Backbone.Model);

Datacenter = (function(_super) {

  __extends(Datacenter, _super);

  function Datacenter() {
    this.get_stats_for_performance = __bind(this.get_stats_for_performance, this);

    this.get_stats = __bind(this.get_stats, this);

    this.get_machines = __bind(this.get_machines, this);

    this.compute_num_machines_not_used_by_other_datacenters = __bind(this.compute_num_machines_not_used_by_other_datacenters, this);
    return Datacenter.__super__.constructor.apply(this, arguments);
  }

  Datacenter.prototype.compute_num_machines_not_used_by_other_datacenters = function(namespace) {
    var datacenter_id, max_machines;
    max_machines = machines.length;
    for (datacenter_id in namespace.get('replica_affinities')) {
      if (datacenter_id !== this.get('id') && (datacenters.get(datacenter_id) != null)) {
        max_machines -= namespace.get('replica_affinities')[datacenter_id];
      }
    }
    if (namespace.get('primary_uuid') !== this.get('id')) {
      max_machines -= 1;
    }
    return max_machines;
  };

  Datacenter.prototype.get_machines = function() {
    var _this = this;
    return machines.filter(function(machine) {
      return machine.get('datacenter_uuid') === _this.get('id');
    });
  };

  Datacenter.prototype.get_stats = function() {
    var machine, stats, _i, _len, _ref;
    stats = {
      dc_disk_space: 0
    };
    _ref = machines.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      machine = _ref[_i];
      if (machine.get('datacenter_uuid') === this.get('id')) {
        stats.dc_disk_space += machine.get_used_disk_space();
      }
    }
    return stats;
  };

  Datacenter.prototype.get_stats_for_performance = function() {
    var has_data, machine, machine_id, namespace, num_machines_in_datacenter, shard_key, __s, _i, _j, _len, _len1, _ref, _ref1, _s;
    __s = {
      keys_read: 0,
      keys_set: 0,
      global_disk_space: 0
    };
    _ref = namespaces.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      namespace = _ref[_i];
      if (!(namespace.get('blueprint') != null) || !(namespace.get('blueprint').peers_roles != null)) {
        continue;
      }
      for (machine_id in namespace.get('blueprint').peers_roles) {
        machine = machines.get(machine_id);
        if (!(machine != null)) {
          continue;
        }
        has_data = false;
        if (machine.get('datacenter_uuid') === this.get('id') && (namespace.get('blueprint').peers_roles[machine_id] != null)) {
          for (shard_key in namespace.get('blueprint').peers_roles[machine_id]) {
            if (namespace.get('blueprint').peers_roles[machine_id][shard_key] !== 'role_nothing') {
              has_data = true;
              break;
            }
          }
          if (has_data === true) {
            break;
          }
        }
      }
      if (has_data === true) {
        _s = namespace.get_stats();
        if (!(_s != null)) {
          continue;
        }
        __s.keys_read += _s.keys_read;
        __s.keys_set += _s.keys_set;
      }
    }
    num_machines_in_datacenter = 0;
    _ref1 = machines.models;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      machine = _ref1[_j];
      if (machine.get('datacenter_uuid') === this.get('id') && machine.is_reachable) {
        num_machines_in_datacenter++;
        __s.global_disk_space += machine.get_used_disk_space();
      }
    }
    return __s;
  };

  return Datacenter;

})(Backbone.Model);

Machine = (function(_super) {

  __extends(Machine, _super);

  function Machine() {
    this.get_data_for_moving = __bind(this.get_data_for_moving, this);

    this.is_master_for_namespaces = __bind(this.is_master_for_namespaces, this);

    this.is_reachable = __bind(this.is_reachable, this);

    this.get_stats_for_performance = __bind(this.get_stats_for_performance, this);

    this.get_used_disk_space = __bind(this.get_used_disk_space, this);

    this.get_stats = __bind(this.get_stats, this);
    return Machine.__super__.constructor.apply(this, arguments);
  }

  Machine.prototype.get_stats = function() {
    var stats;
    stats = this.get('stats');
    if (!(stats != null)) {
      stats = {};
    }
    if (!(stats.proc != null)) {
      stats.proc = {};
    }
    return stats;
  };

  Machine.prototype.get_used_disk_space = function() {
    var machine_disk_space, nid, stats, value, _ref;
    machine_disk_space = 0;
    _ref = this.get_stats();
    for (nid in _ref) {
      value = _ref[nid];
      if (namespaces.get(nid) != null) {
        stats = value.cache;
        if (stats != null) {
          machine_disk_space += parseInt(stats.block_size) * parseInt(stats.blocks_total);
        }
      }
    }
    return machine_disk_space;
  };

  Machine.prototype.get_stats_for_performance = function() {
    var namespace, stats_full, __s, _i, _len, _ref, _s;
    stats_full = this.get_stats();
    __s = {
      keys_read: 0,
      keys_set: 0,
      global_disk_space: parseInt(this.get_used_disk_space())
    };
    _ref = namespaces.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      namespace = _ref[_i];
      _s = namespace.get_stats();
      if (!(_s != null)) {
        continue;
      }
      if (namespace.get('id') in stats_full) {
        __s.keys_read += _s.keys_read;
        __s.keys_set += _s.keys_set;
      }
    }
    return __s;
  };

  Machine.prototype.is_reachable = function() {
    var reachable;
    reachable = directory.get(this.get('id')) != null;
    return reachable;
  };

  Machine.prototype.is_master_for_namespaces = function() {
    var _this = this;
    return namespaces.filter(function(namespace) {
      var machine_uuid, peer_roles, role, shard, _ref;
      _ref = namespace.get('blueprint').peers_roles;
      for (machine_uuid in _ref) {
        peer_roles = _ref[machine_uuid];
        if (machine_uuid === _this.get('id')) {
          for (shard in peer_roles) {
            role = peer_roles[shard];
            if (role === 'role_primary') {
              return true;
            }
          }
        }
      }
    });
  };

  Machine.prototype.get_data_for_moving = function() {
    var data, dc_uuid, namespace, namespaces_with_critical_issue, namespaces_with_unsatisfiable_goals, num_machines_in_dc, num_replicas, _i, _len, _ref,
      _this = this;
    data = {};
    dc_uuid = this.get('datacenter_uuid');
    if (dc_uuid !== universe_datacenter.get('id')) {
      num_machines_in_dc = 0;
      machines.each(function(machine) {
        if (dc_uuid === machine.get('datacenter_uuid')) {
          return num_machines_in_dc++;
        }
      });
      namespaces_with_critical_issue = [];
      namespaces_with_unsatisfiable_goals = [];
      _ref = namespaces.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        namespace = _ref[_i];
        if (dc_uuid in namespace.get('replica_affinities')) {
          num_replicas = namespace.get('replica_affinities')[dc_uuid];
          if (namespace.get('primary_uuid') === dc_uuid) {
            num_replicas++;
          }
        }
        if (num_machines_in_dc <= num_replicas) {
          namespaces_with_unsatisfiable_goals.push({
            id: namespace.get('id'),
            name: namespace.get('name')
          });
        }
        if (num_machines_in_dc === 1 && dc_uuid === namespace.get('primary_uuid')) {
          namespaces_with_critical_issue.push({
            id: namespace.get('id'),
            name: namespace.get('name')
          });
        }
      }
      if (namespaces_with_unsatisfiable_goals.length > 0) {
        data = _.extend(data, {
          has_warning: true,
          namespaces_with_unsatisfiable_goals: namespaces_with_unsatisfiable_goals,
          num_namespaces_with_unsatisfiable_goals: namespaces_with_unsatisfiable_goals.length
        });
      }
      if (namespaces_with_critical_issue.length > 0) {
        data = _.extend(data, {
          namespaces_with_critical_issue: namespaces_with_critical_issue,
          num_namespaces_with_critical_issue: namespaces_with_critical_issue.length
        });
      }
      if (namespaces_with_unsatisfiable_goals.length > 0 || namespaces_with_critical_issue.length > 0) {
        data = _.extend(data, {
          has_warning: true,
          datacenter_id: this.get('datacenter_uuid'),
          datacenter_name: datacenters.get(this.get('datacenter_uuid')).get('name'),
          machine_id: this.get('id'),
          machine_name: this.get('name')
        });
      }
    }
    return data;
  };

  return Machine;

})(Backbone.Model);

LogEntry = (function(_super) {

  __extends(LogEntry, _super);

  function LogEntry() {
    this.get_formatted_message = __bind(this.get_formatted_message, this);

    this.get_iso_8601_timestamp = __bind(this.get_iso_8601_timestamp, this);
    return LogEntry.__super__.constructor.apply(this, arguments);
  }

  LogEntry.prototype.get_iso_8601_timestamp = function() {
    return new Date(this.get('timestamp') * 1000);
  };

  LogEntry.prototype.get_formatted_message = function() {
    var msg;
    return msg = this.get('message');
  };

  return LogEntry;

})(Backbone.Model);

Issue = (function(_super) {

  __extends(Issue, _super);

  function Issue() {
    return Issue.__super__.constructor.apply(this, arguments);
  }

  return Issue;

})(Backbone.Model);

IssueRedundancy = (function(_super) {

  __extends(IssueRedundancy, _super);

  function IssueRedundancy() {
    return IssueRedundancy.__super__.constructor.apply(this, arguments);
  }

  return IssueRedundancy;

})(Backbone.Model);

Progress = (function(_super) {

  __extends(Progress, _super);

  function Progress() {
    return Progress.__super__.constructor.apply(this, arguments);
  }

  return Progress;

})(Backbone.Model);

MachineAttributes = (function(_super) {

  __extends(MachineAttributes, _super);

  function MachineAttributes() {
    return MachineAttributes.__super__.constructor.apply(this, arguments);
  }

  return MachineAttributes;

})(Backbone.Model);

ConnectionStatus = (function(_super) {

  __extends(ConnectionStatus, _super);

  function ConnectionStatus() {
    return ConnectionStatus.__super__.constructor.apply(this, arguments);
  }

  return ConnectionStatus;

})(Backbone.Model);

ComputedCluster = (function(_super) {

  __extends(ComputedCluster, _super);

  function ComputedCluster() {
    this.get_stats = __bind(this.get_stats, this);
    return ComputedCluster.__super__.constructor.apply(this, arguments);
  }

  ComputedCluster.prototype.initialize = function() {
    log_initial('(initializing) computed cluster model');
    return ComputedCluster.__super__.initialize.apply(this, arguments);
  };

  ComputedCluster.prototype.get_stats = function() {
    var m, namespace, __s, _i, _j, _len, _len1, _ref, _ref1, _s;
    __s = {
      keys_read: 0,
      keys_set: 0,
      global_disk_space: 0
    };
    _ref = namespaces.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      namespace = _ref[_i];
      _s = namespace.get_stats();
      if (!(_s != null)) {
        continue;
      }
      __s.keys_read += _s.keys_read;
      __s.keys_set += _s.keys_set;
    }
    _ref1 = machines.models;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      m = _ref1[_j];
      __s.global_disk_space += m.get_used_disk_space();
    }
    return __s;
  };

  return ComputedCluster;

})(Backbone.Model);

Databases = (function(_super) {

  __extends(Databases, _super);

  function Databases() {
    return Databases.__super__.constructor.apply(this, arguments);
  }

  Databases.prototype.model = Database;

  Databases.prototype.name = 'Databases';

  return Databases;

})(Backbone.Collection);

Namespaces = (function(_super) {

  __extends(Namespaces, _super);

  function Namespaces() {
    return Namespaces.__super__.constructor.apply(this, arguments);
  }

  Namespaces.prototype.model = Namespace;

  Namespaces.prototype.name = 'Namespaces';

  return Namespaces;

})(Backbone.Collection);

Datacenters = (function(_super) {

  __extends(Datacenters, _super);

  function Datacenters() {
    return Datacenters.__super__.constructor.apply(this, arguments);
  }

  Datacenters.prototype.model = Datacenter;

  Datacenters.prototype.name = 'Datacenters';

  return Datacenters;

})(Backbone.Collection);

Machines = (function(_super) {

  __extends(Machines, _super);

  function Machines() {
    return Machines.__super__.constructor.apply(this, arguments);
  }

  Machines.prototype.model = Machine;

  Machines.prototype.name = 'Machines';

  return Machines;

})(Backbone.Collection);

Issues = (function(_super) {

  __extends(Issues, _super);

  function Issues() {
    return Issues.__super__.constructor.apply(this, arguments);
  }

  Issues.prototype.model = Issue;

  Issues.prototype.url = 'ajax/issues';

  return Issues;

})(Backbone.Collection);

IssuesRedundancy = (function(_super) {

  __extends(IssuesRedundancy, _super);

  function IssuesRedundancy() {
    this.compute_redundancy_errors = __bind(this.compute_redundancy_errors, this);
    return IssuesRedundancy.__super__.constructor.apply(this, arguments);
  }

  IssuesRedundancy.prototype.model = IssueRedundancy;

  IssuesRedundancy.prototype.num_replicas = 0;

  IssuesRedundancy.prototype.initialize = function() {
    directory.on('all', this.compute_redundancy_errors);
    return namespaces.on('all', this.compute_redundancy_errors);
  };

  IssuesRedundancy.prototype.convert_activity = function(role) {
    switch (role) {
      case 'role_secondary':
        return 'secondary_up_to_date';
      case 'role_nothing':
        return 'nothing';
      case 'role_primary':
        return 'primary';
    }
  };

  IssuesRedundancy.prototype.compute_redundancy_errors = function() {
    var blueprint, directory_by_namespaces, issue_redundancy, issue_redundancy_param, issues_redundancy_new, key, machine_id, machine_name, namespace, namespace_id, num_replicas, value, _i, _len, _ref;
    issues_redundancy_new = [];
    num_replicas = 0;
    directory_by_namespaces = DataUtils.get_directory_activities_by_namespaces();
    _ref = namespaces.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      namespace = _ref[_i];
      namespace_id = namespace.get('id');
      blueprint = namespace.get('blueprint').peers_roles;
      for (machine_id in blueprint) {
        if ((machines.get(machine_id) != null) && (machines.get(machine_id).get('name') != null)) {
          machine_name = machines.get(machine_id).get('name');
        } else {
          machine_name = machine_id;
        }
        for (key in blueprint[machine_id]) {
          value = blueprint[machine_id][key];
          if (value === "role_primary" || value === "role_secondary") {
            num_replicas++;
            if (!(directory_by_namespaces != null) || !(directory_by_namespaces[namespace_id] != null) || !(directory_by_namespaces[namespace_id][machine_id] != null)) {
              issue_redundancy_param = {
                machine_id: machine_id,
                machine_name: machine_name,
                namespace_uuid: namespace_id,
                namespace_name: namespace.get('name'),
                shard: key,
                blueprint: value,
                directory: 'not_found'
              };
              issue_redundancy = new IssueRedundancy(issue_redundancy_param);
              issues_redundancy_new.push(issue_redundancy);
            } else if (directory_by_namespaces[namespace_id][machine_id][key] !== this.convert_activity(value)) {
              issue_redundancy_param = {
                machine_id: machine_id,
                machine_name: machine_name,
                namespace_uuid: namespace_id,
                namespace_name: namespace.get('name'),
                shard: key,
                blueprint: value,
                directory: directory_by_namespaces[namespace_id][machine_id][key]
              };
              issues_redundancy_new.push(new IssueRedundancy(issue_redundancy_param));
            }
          }
        }
      }
    }
    if (issues_redundancy_new.length > 0 || issues_redundancy_new.length !== this.length) {
      this.reset(issues_redundancy_new);
    }
    if (num_replicas !== this.num_replicas) {
      this.num_replicas = num_replicas;
      return this.trigger('reset');
    }
  };

  return IssuesRedundancy;

})(Backbone.Collection);

ProgressList = (function(_super) {

  __extends(ProgressList, _super);

  function ProgressList() {
    return ProgressList.__super__.constructor.apply(this, arguments);
  }

  ProgressList.prototype.model = Progress;

  ProgressList.prototype.url = 'ajax/progress';

  return ProgressList;

})(Backbone.Collection);

Directory = (function(_super) {

  __extends(Directory, _super);

  function Directory() {
    return Directory.__super__.constructor.apply(this, arguments);
  }

  Directory.prototype.model = MachineAttributes;

  Directory.prototype.url = 'ajax/directory';

  return Directory;

})(Backbone.Collection);

module('DataUtils', function() {
  this.Shard = (function(_super) {

    __extends(Shard, _super);

    function Shard() {
      this.destroy = __bind(this.destroy, this);

      this.set_uuids = __bind(this.set_uuids, this);

      this.initialize = __bind(this.initialize, this);

      this.get_secondary_uuids = __bind(this.get_secondary_uuids, this);

      this.get_primary_uuid = __bind(this.get_primary_uuid, this);
      return Shard.__super__.constructor.apply(this, arguments);
    }

    Shard.prototype.get_primary_uuid = function() {
      return DataUtils.get_shard_primary_uuid(this.namespace.get('id'), this.shard);
    };

    Shard.prototype.get_secondary_uuids = function() {
      return DataUtils.get_shard_secondary_uuids(this.namespace.get('id'), this.shard);
    };

    Shard.prototype.initialize = function(shard, namespace) {
      this.shard = shard;
      this.namespace = namespace;
      this.set('shard_boundaries', this.shard);
      this.set('primary_uuid', this.get_primary_uuid());
      this.set('secondary_uuids', this.get_secondary_uuids());
      return namespace.on('change:blueprint', this.set_uuids);
    };

    Shard.prototype.set_uuids = function() {
      var new_primary_uuid, new_secondary_uuids;
      new_primary_uuid = this.get_primary_uuid();
      new_secondary_uuids = this.get_secondary_uuids();
      if (this.get('primary_uuid') !== new_primary_uuid) {
        this.set('primary_uuid', new_primary_uuid);
      }
      if (!_.isEqual(this.get('secondary_uuids'), new_secondary_uuids)) {
        return this.set('secondary_uuids', new_secondary_uuids);
      }
    };

    Shard.prototype.destroy = function() {
      return namespace.on('change:blueprint', this.set_uuids);
    };

    return Shard;

  })(Backbone.Model);
  this.Shards = (function(_super) {

    __extends(Shards, _super);

    function Shards() {
      this.destroy = __bind(this.destroy, this);

      this.compute_shards = __bind(this.compute_shards, this);

      this.compute_shards_without_args = __bind(this.compute_shards_without_args, this);

      this.initialize = __bind(this.initialize, this);
      return Shards.__super__.constructor.apply(this, arguments);
    }

    Shards.prototype.model = DataUtils.Shard;

    Shards.prototype.initialize = function(models, namespace) {
      this.namespace = namespace;
      this.namespace.on('change:shards', this.compute_shards_without_args);
      return this.namespace.on('add', this.compute_shards_without_args);
    };

    Shards.prototype.compute_shards_without_args = function() {
      return this.compute_shards(this.namespace.get('shards'));
    };

    Shards.prototype.compute_shards = function(shards) {
      var new_shards, shard, _i, _len;
      new_shards = [];
      for (_i = 0, _len = shards.length; _i < _len; _i++) {
        shard = shards[_i];
        new_shards.push(new DataUtils.Shard(shard, this.namespace));
      }
      return this.reset(new_shards);
    };

    Shards.prototype.destroy = function() {
      this.namespace.off('change:shards', this.compute_shards_without_args);
      return this.namespace.off('add', this.compute_shards_without_args);
    };

    return Shards;

  })(Backbone.Collection);
  this.stripslashes = function(str) {
    str = str.replace(/\\'/g, '\'');
    str = str.replace(/\\"/g, '"');
    str = str.replace(/\\0/g, "\x00");
    str = str.replace(/\\\\/g, '\\');
    return str;
  };
  this.get_machine_reachability = function(machine_uuid) {
    var json, last_seen, reachable, _m;
    reachable = directory.get(machine_uuid) != null;
    if (!reachable) {
      _m = machines.get(machine_uuid);
      if (_m != null) {
        last_seen = _m.get('last_seen');
      } else {
        last_seen = null;
      }
      if (last_seen) {
        last_seen = $.timeago(new Date(parseInt(last_seen) * 1000));
      }
    }
    json = {
      reachable: reachable,
      last_seen: last_seen
    };
    return json;
  };
  this.get_datacenter_reachability = function(datacenter_uuid) {
    var json, last_seen, machine, reachable, total, _i, _last_seen, _len, _ref,
      _this = this;
    total = (_.filter(machines.models, function(m) {
      return m.get('datacenter_uuid') === datacenter_uuid;
    })).length;
    reachable = (_.filter(directory.models, function(m) {
      var _m;
      _m = machines.get(m.get('id'));
      if (_m != null) {
        return _m.get('datacenter_uuid') === datacenter_uuid;
      } else {
        return false;
      }
    })).length;
    if (reachable === 0 && total > 0) {
      _ref = machines.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        machine = _ref[_i];
        if (machine.get('datacenter_uuid') === datacenter_uuid) {
          _last_seen = machine.get('last_seen');
          if (last_seen) {
            if (_last_seen > last_seen) {
              last_seen = _last_seen;
            }
          } else {
            last_seen = _last_seen;
          }
        }
      }
      last_seen = $.timeago(new Date(parseInt(last_seen) * 1000));
    }
    json = {
      total: total,
      reachable: reachable,
      last_seen: last_seen
    };
    return json;
  };
  this.get_shard_primary_uuid = function(namespace_uuid, shard) {
    var machine_uuid, peers_roles, role, _ref, _shard;
    _ref = namespaces.get(namespace_uuid).get('blueprint').peers_roles;
    for (machine_uuid in _ref) {
      peers_roles = _ref[machine_uuid];
      for (_shard in peers_roles) {
        role = peers_roles[_shard];
        if (shard.toString() === _shard.toString() && role === 'role_primary') {
          return machine_uuid;
        }
      }
    }
    return null;
  };
  this.get_shard_secondary_uuids = function(namespace_uuid, shard) {
    var datacenter_uuid, machine_uuid, peers_roles, role, secondaries, _ref, _shard;
    secondaries = {};
    _ref = namespaces.get(namespace_uuid).get('blueprint').peers_roles;
    for (machine_uuid in _ref) {
      peers_roles = _ref[machine_uuid];
      if (!(machines.get(machine_uuid) != null)) {
        continue;
      }
      datacenter_uuid = machines.get(machine_uuid).get('datacenter_uuid');
      for (_shard in peers_roles) {
        role = peers_roles[_shard];
        if (shard.toString() === _shard.toString() && role === 'role_secondary') {
          if (!(secondaries[datacenter_uuid] != null)) {
            secondaries[datacenter_uuid] = [];
          }
          secondaries[datacenter_uuid][secondaries[datacenter_uuid].length] = machine_uuid;
        }
      }
    }
    return secondaries;
  };
  this.get_ack_expectations = function(namespace_uuid, datacenter_uuid) {
    var acks, namespace, _ref, _ref1;
    namespace = namespaces.get(namespace_uuid);
    acks = namespace != null ? (_ref = namespace.get('ack_expectations')) != null ? (_ref1 = _ref[datacenter_uuid]) != null ? _ref1.expectation : void 0 : void 0 : void 0;
    if (acks != null) {
      return acks;
    } else {
      return 0;
    }
  };
  this.get_replica_affinities = function(namespace_uuid, datacenter_uuid) {
    var affs, datacenter, namespace, _ref;
    namespace = namespaces.get(namespace_uuid);
    if (datacenter_uuid === universe_datacenter.get('id')) {
      datacenter = universe_datacenter;
    } else {
      datacenter = datacenters.get(datacenter_uuid);
    }
    affs = namespace != null ? (_ref = namespace.get('replica_affinities')) != null ? _ref[datacenter != null ? datacenter.get('id') : void 0] : void 0 : void 0;
    if (affs != null) {
      return affs;
    } else {
      return 0;
    }
  };
  this.get_datacenter_machines = function(datacenter_uuid) {
    return _.filter(machines.models, function(m) {
      return m.get('datacenter_uuid') === datacenter_uuid;
    });
  };
  this.get_namespace_machines = function(namespace_uuid) {
    var mid, mids, roles, _n;
    mids = [];
    _n = namespaces.get(namespace_uuid);
    if (!_n) {
      return [];
    }
    _n = _n.get('blueprint').peers_roles;
    for (mid in _n) {
      roles = _n[mid];
      mids.push(mid);
    }
    return mids;
  };
  this.get_directory_activities = function() {
    var activities, activity, activity_id, activity_map, bcards, machine, namespace_id, _i, _len, _ref;
    activities = {};
    _ref = directory.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      machine = _ref[_i];
      bcards = machine.get('rdb_namespaces')['reactor_bcards'];
      for (namespace_id in bcards) {
        activity_map = bcards[namespace_id];
        activity_map = activity_map['activity_map'];
        for (activity_id in activity_map) {
          activity = activity_map[activity_id];
          activities[activity_id] = {
            value: activity,
            machine_id: machine.get('id'),
            namespace_id: namespace_id
          };
        }
      }
    }
    return activities;
  };
  this.get_directory_activities_by_namespaces = function() {
    var activities, activity, activity_id, activity_map, bcards, machine, namespace_id, _i, _len, _ref;
    activities = {};
    _ref = directory.models;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      machine = _ref[_i];
      bcards = machine.get('rdb_namespaces')['reactor_bcards'];
      for (namespace_id in bcards) {
        activity_map = bcards[namespace_id];
        activity_map = activity_map['activity_map'];
        for (activity_id in activity_map) {
          activity = activity_map[activity_id];
          if (!(namespace_id in activities)) {
            activities[namespace_id] = {};
          }
          if (!(activities[namespace_id][machine.get('id')] != null)) {
            activities[namespace_id][machine.get('id')] = {};
          }
          activities[namespace_id][machine.get('id')][activity[0]] = activity[1]['type'];
        }
      }
    }
    return activities;
  };
  this.get_backfill_progress = function(namespace_uuid, shard, machine_uuid) {
    var activity, activity_map, activity_type, activity_uuid, agg_json, agg_start, backfiller, i, into_shard, json, output_json, progress, progress_info, progress_info_arr, ratio_available, sender, senders_activity_id, shard_map, union_shard, _i, _j, _len, _output_json, _pia, _ref, _ref1, _us;
    activity_map = this.get_directory_activities();
    _output_json = [];
    if (typeof shard !== 'string') {
      shard = JSON.stringify(shard);
    }
    progress = progress_list.get(machine_uuid);
    if (!(progress != null)) {
      return null;
    }
    progress = progress.get(namespace_uuid);
    if (!(progress != null)) {
      return null;
    }
    for (activity_uuid in progress) {
      shard_map = progress[activity_uuid];
      activity = activity_map[activity_uuid];
      if (!(activity != null)) {
        return null;
      }
      activity_type = activity.value[1].type;
      into_shard = activity.value[0];
      if (into_shard.replace(/\s/g, '') !== shard.replace(/\s/g, '')) {
        continue;
      }
      senders_activity_id = [];
      if (activity_type === 'secondary_backfilling') {
        senders_activity_id.push(activity.value[1].backfiller.activity_id);
      } else if (activity_type === 'primary_when_safe') {
        _ref = activity.value[1].backfillers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          backfiller = _ref[_i];
          senders_activity_id.push(backfiller.activity_id);
        }
      }
      union_shard = null;
      progress_info_arr = null;
      for (_us in shard_map) {
        _pia = shard_map[_us];
        union_shard = _us;
        progress_info_arr = _pia;
        break;
      }
      for (i = _j = 0, _ref1 = progress_info_arr.length - 1; 0 <= _ref1 ? _j <= _ref1 : _j >= _ref1; i = 0 <= _ref1 ? ++_j : --_j) {
        progress_info = progress_info_arr[i];
        sender = activity_map[senders_activity_id[i]];
        ratio_available = typeof progress_info !== 'string';
        json = {
          replicated_blocks: ratio_available ? progress_info[0] : null,
          total_blocks: ratio_available ? progress_info[1] : null,
          block_info_available: ratio_available && progress_info[0] !== -1 && progress_info[1] !== -1,
          ratio_available: ratio_available,
          machine_id: sender.machine_id
        };
        _output_json.push(json);
      }
    }
    if (_output_json.length === 0) {
      return null;
    }
    agg_start = {
      total_blocks: -1,
      replicated_blocks: -1,
      block_info_available: false,
      ratio_available: false,
      backfiller_machines: []
    };
    agg_json = _.reduce(_output_json, (function(agg, val) {
      if (val.block_info_available) {
        if (agg.total_blocks === -1) {
          agg.total_blocks = 0;
        }
        if (agg.replicated_blocks === -1) {
          agg.replicated_blocks = 0;
        }
        agg.total_blocks += val.total_blocks;
        agg.replicated_blocks += val.replicated_blocks;
        agg.block_info_available = true;
      }
      if (val.ratio_available) {
        agg.ratio_available = true;
      }
      if (typeof val.machine_id === 'string') {
        agg.backfiller_machines.push({
          machine_id: val.machine_id,
          machine_name: machines.get(val.machine_id).get('name')
        });
      }
      return agg;
    }), agg_start);
    output_json = {
      ratio: agg_json.replicated_blocks / agg_json.total_blocks,
      percentage: Math.round(agg_json.replicated_blocks / agg_json.total_blocks * 100)
    };
    output_json = _.extend(output_json, agg_json);
    return output_json;
  };
  this.get_backfill_progress_agg = function(namespace_uuid, datacenter_uuid) {
    var agg_json, agg_start, backfills, datacenter_machines, machine_uuid, machines, namespace_machines, output_json, shard, _i, _j, _len, _len1, _ref;
    namespace_machines = this.get_namespace_machines(namespace_uuid);
    if (datacenter_uuid != null) {
      datacenter_machines = _.map(this.get_datacenter_machines(datacenter_uuid), function(m) {
        return m.get('id');
      });
    } else {
      datacenter_machines = namespace_machines;
    }
    machines = _.intersection(namespace_machines, datacenter_machines);
    backfills = [];
    for (_i = 0, _len = machines.length; _i < _len; _i++) {
      machine_uuid = machines[_i];
      _ref = namespaces.get(namespace_uuid).get('shards');
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        shard = _ref[_j];
        backfills.push(this.get_backfill_progress(namespace_uuid, shard, machine_uuid));
      }
    }
    backfills = _.without(backfills, null);
    if (backfills.length === 0) {
      return null;
    }
    agg_start = {
      total_blocks: -1,
      replicated_blocks: -1,
      block_info_available: false,
      ratio_available: false
    };
    agg_json = _.reduce(backfills, (function(agg, val) {
      if (!(val != null)) {
        return agg;
      }
      if (val.block_info_available) {
        if (agg.total_blocks === -1) {
          agg.total_blocks = 0;
        }
        if (agg.replicated_blocks === -1) {
          agg.replicated_blocks = 0;
        }
        agg.total_blocks += val.total_blocks;
        agg.replicated_blocks += val.replicated_blocks;
        agg.block_info_available = true;
      }
      if (val.ratio_available) {
        agg.ratio_available = true;
      }
      return agg;
    }), agg_start);
    output_json = {
      ratio: agg_json.replicated_blocks / agg_json.total_blocks,
      percentage: Math.round(agg_json.replicated_blocks / agg_json.total_blocks * 100)
    };
    output_json = _.extend(output_json, agg_json);
    return output_json;
  };
  this.get_namespace_status = function(namespace_uuid, datacenter_uuid) {
    var json, machine_active_for_namespace, machine_uuid, namespace, peer_accessible, role, role_name, shard, _datacenters, _machines, _ref, _ref1;
    namespace = namespaces.get(namespace_uuid);
    json = {
      nshards: 0,
      nreplicas: 0,
      nashards: 0,
      nareplicas: 0
    };
    if (!(namespace != null)) {
      return null;
    }
    _machines = [];
    _datacenters = [];
    _ref = namespace.get('blueprint').peers_roles;
    for (machine_uuid in _ref) {
      role = _ref[machine_uuid];
      if (!(machines.get(machine_uuid) != null)) {
        continue;
      }
      if ((datacenter_uuid != null) && ((_ref1 = machines.get(machine_uuid)) != null ? _ref1.get('datacenter_uuid') : void 0) !== datacenter_uuid) {
        continue;
      }
      peer_accessible = directory.get(machine_uuid);
      machine_active_for_namespace = false;
      for (shard in role) {
        role_name = role[shard];
        if (role_name === 'role_primary') {
          machine_active_for_namespace = true;
          json.nshards += 1;
          json.nreplicas += 1;
          if (peer_accessible != null) {
            json.nashards += 1;
            json.nareplicas += 1;
          }
        }
        if (role_name === 'role_secondary') {
          machine_active_for_namespace = true;
          json.nreplicas += 1;
          if (peer_accessible != null) {
            json.nareplicas += 1;
          }
        }
      }
      if (machine_active_for_namespace) {
        _machines.push(machine_uuid);
        if (!(datacenter_uuid != null) || datacenter_uuid !== universe_datacenter.get('id')) {
          _datacenters.push(machines.get(machine_uuid).get('datacenter_uuid'));
        }
      }
    }
    json.nmachines = _.uniq(_machines).length;
    json.ndatacenters = _.uniq(_datacenters).length;
    if (json.nshards === json.nashards) {
      json.reachability = 'Live';
    } else {
      json.reachability = 'Down';
    }
    json.backfill_progress = this.get_backfill_progress_agg(namespace_uuid, datacenter_uuid);
    return json;
  };
  this.is_integer = function(data) {
    return data.search(/^\d+$/) !== -1;
  };
  this.deep_copy = function(data) {
    var key, result, value, _i, _len;
    if (typeof data === 'boolean' || typeof data === 'number' || typeof data === 'string' || typeof data === 'number' || data === null || data === void 0) {
      return data;
    } else if (typeof data === 'object' && Object.prototype.toString.call(data) === '[object Array]') {
      result = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        value = data[_i];
        result.push(this.deep_copy(value));
      }
      return result;
    } else if (typeof data === 'object') {
      result = {};
      for (key in data) {
        value = data[key];
        result[key] = this.deep_copy(value);
      }
      return result;
    }
  };
  return this.approximate_count = function(num) {
    var approx, result;
    if (num === 0) {
      return '0';
    } else if (num <= 5) {
      return '5';
    } else if (num <= 10) {
      return '10';
    } else {
      approx = Math.round(num / Math.pow(10, num.toString().length - 2)) * Math.pow(10, num.toString().length - 2);
      if (approx < 100) {
        return (Math.floor(approx / 10) * 10).toString();
      } else if (approx < 1000) {
        return (Math.floor(approx / 100) * 100).toString();
      } else if (approx < 1000000) {
        result = (approx / 1000).toString();
        if (result.length === 1) {
          result = result + '.0';
        }
        return result + 'K';
      } else if (approx < 1000000000) {
        result = (approx / 1000000).toString();
        if (result.length === 1) {
          result = result + '.0';
        }
        return result + 'M';
      } else {
        result = (approx / 1000000000).toString();
        if (result.length === 1) {
          result = result + '.0';
        }
        return result + 'B';
      }
    }
  };
});

NavBarView = (function(_super) {

  __extends(NavBarView, _super);

  function NavBarView() {
    this.update_cog_icon = __bind(this.update_cog_icon, this);

    this.set_active_tab = __bind(this.set_active_tab, this);

    this.render = __bind(this.render, this);

    this.init_typeahead = __bind(this.init_typeahead, this);

    this.initialize = __bind(this.initialize, this);
    return NavBarView.__super__.constructor.apply(this, arguments);
  }

  NavBarView.prototype.id = 'navbar';

  NavBarView.prototype.className = 'container';

  NavBarView.prototype.template = Handlebars.templates['navbar_view-template'];

  NavBarView.prototype.events = {
    'click .options_link': 'update_cog_icon'
  };

  NavBarView.prototype.initialize = function() {
    this.first_render = true;
    return this.options_state = 'hidden';
  };

  NavBarView.prototype.init_typeahead = function() {
    return this.$('input.search-box').typeahead({
      source: function(typeahead, query) {
        var _databases, _datacenters, _machines, _namespaces;
        _machines = _.map(machines.models, function(machine) {
          return {
            uuid: machine.get('id'),
            name: machine.get('name') + ' (machine)',
            type: 'servers'
          };
        });
        _datacenters = _.map(datacenters.models, function(datacenter) {
          return {
            uuid: datacenter.get('id'),
            name: datacenter.get('name') + ' (datacenter)',
            type: 'datacenters'
          };
        });
        _namespaces = _.map(namespaces.models, function(namespace) {
          return {
            uuid: namespace.get('id'),
            name: namespace.get('name') + ' (namespace)',
            type: 'tables'
          };
        });
        _databases = _.map(databases.models, function(database) {
          return {
            uuid: database.get('id'),
            name: database.get('name') + ' (database)',
            type: 'databases'
          };
        });
        return _machines.concat(_datacenters).concat(_namespaces).concat(_databases);
      },
      property: 'name',
      onselect: function(obj) {
        return window.app.navigate('#' + obj.type + '/' + obj.uuid, {
          trigger: true
        });
      }
    });
  };

  NavBarView.prototype.render = function(route) {
    log_render('(rendering) NavBarView');
    this.$el.html(this.template());
    this.set_active_tab(route);
    if (this.first_render === true) {
      this.init_typeahead();
      this.first_render = false;
    }
    return this;
  };

  NavBarView.prototype.set_active_tab = function(route) {
    if (route != null) {
      this.$('ul.nav-left li').removeClass('active');
      switch (route) {
        case 'route:dashboard':
          return this.$('li#nav-dashboard').addClass('active');
        case 'route:index_namespaces':
          return this.$('li#nav-namespaces').addClass('active');
        case 'route:namespace':
          return this.$('li#nav-namespaces').addClass('active');
        case 'route:database':
          return this.$('li#nav-namespaces').addClass('active');
        case 'route:index_servers':
          return this.$('li#nav-servers').addClass('active');
        case 'route:server':
          return this.$('li#nav-servers').addClass('active');
        case 'route:datacenter':
          return this.$('li#nav-servers').addClass('active');
        case 'route:dataexplorer':
          return this.$('li#nav-dataexplorer').addClass('active');
        case 'route:logs':
          return this.$('li#nav-logs').addClass('active');
      }
    }
  };

  NavBarView.prototype.update_cog_icon = function(event) {
    this.$('.cog_icon').toggleClass('active');
    return window.options_view.toggle_options(event);
  };

  return NavBarView;

})(Backbone.View);

Backbone.View.prototype.destroy = function() {};

BackboneCluster = (function(_super) {

  __extends(BackboneCluster, _super);

  function BackboneCluster() {
    this.set_stats_call = __bind(this.set_stats_call, this);
    return BackboneCluster.__super__.constructor.apply(this, arguments);
  }

  BackboneCluster.prototype.routes = {
    '': 'dashboard',
    'databases': 'index_namespaces',
    'databases/:id': 'database',
    'databases/:id/:tab': 'database',
    'tables': 'index_namespaces',
    'tables/:id': 'namespace',
    'tables/:id/:tab': 'namespace',
    'servers': 'index_servers',
    'datacenters/:id': 'datacenter',
    'datacenters/:id/:tab': 'datacenter',
    'servers/:id': 'server',
    'servers/:id/:tab': 'server',
    'dashboard': 'dashboard',
    'resolve_issues': 'resolve_issues',
    'logs': 'logs',
    'dataexplorer': 'dataexplorer'
  };

  BackboneCluster.prototype.initialize = function() {
    log_initial('(initializing) router');
    BackboneCluster.__super__.initialize.apply(this, arguments);
    window.app = this;
    this.$container = $('#cluster');
    this.current_view = new Backbone.View;
    this.$sidebar = $('#sidebar');
    this.sidebar = new Sidebar.Container;
    this.render_sidebar();
    this.navbar = new NavBarView;
    this.render_navbar();
    return this.bind('all', function(route, router) {
      return this.navbar.set_active_tab(route);
    });
  };

  BackboneCluster.prototype.render_sidebar = function() {
    return this.$sidebar.html(this.sidebar.render().el);
  };

  BackboneCluster.prototype.render_navbar = function() {
    return $('#navbar-container').html(this.navbar.render().el);
  };

  BackboneCluster.prototype.set_stats_call = function(url) {
    clearTimeout(stats_param.timeout);
    if (url !== '') {
      stats_param.url = url;
      return collect_stat_data();
    }
  };

  BackboneCluster.prototype.index_namespaces = function(data) {
    this.set_stats_call('');
    clear_modals();
    this.current_view.destroy();
    this.current_view = new NamespaceView.DatabaseList;
    if ((data != null ? data.alert_message : void 0) != null) {
      return this.$container.html(this.current_view.render(data.alert_message).el);
    } else {
      return this.$container.html(this.current_view.render().el);
    }
  };

  BackboneCluster.prototype.index_servers = function(data) {
    this.set_stats_call('');
    clear_modals();
    this.current_view.destroy();
    this.current_view = new ServerView.DatacenterList;
    if ((data != null ? data.alert_message : void 0) != null) {
      return this.$container.html(this.current_view.render(data.alert_message).el);
    } else {
      return this.$container.html(this.current_view.render().el);
    }
  };

  BackboneCluster.prototype.dashboard = function() {
    this.set_stats_call('ajax/stat?filter=.*/serializers,proc,sys');
    clear_modals();
    this.current_view.destroy();
    this.current_view = new DashboardView.Container;
    return this.$container.html(this.current_view.render().el);
  };

  BackboneCluster.prototype.resolve_issues = function() {
    this.set_stats_call('');
    log_router('/resolve_issues');
    clear_modals();
    this.current_view.destroy();
    this.current_view = new ResolveIssuesView.Container;
    return this.$container.html(this.current_view.render().el);
  };

  BackboneCluster.prototype.logs = function() {
    this.set_stats_call('');
    log_router('/logs');
    clear_modals();
    this.current_view.destroy();
    this.current_view = new LogView.Container;
    return this.$container.html(this.current_view.render().el);
  };

  BackboneCluster.prototype.dataexplorer = function() {
    this.set_stats_call('');
    log_router('/dataexplorer');
    clear_modals();
    this.current_view.destroy();
    this.current_view = new DataExplorerView.Container({
      state: DataExplorerView.state
    });
    this.$container.html(this.current_view.render().el);
    this.current_view.init_after_dom_rendered();
    return this.current_view.results_view.set_scrollbar();
  };

  BackboneCluster.prototype.database = function(id, tab) {
    var database;
    this.set_stats_call('ajax/stat?filter=.*/serializers');
    log_router('/databases/' + id);
    clear_modals();
    database = databases.get(id);
    this.current_view.destroy();
    if (database != null) {
      this.current_view = new DatabaseView.Container({
        model: database
      });
    } else {
      this.current_view = new DatabaseView.NotFound(id);
    }
    return this.$container.html(this.current_view.render().el);
  };

  BackboneCluster.prototype.namespace = function(id, tab) {
    var namespace;
    this.set_stats_call('ajax/stat?filter=' + id + '/serializers');
    log_router('/namespaces/' + id);
    clear_modals();
    namespace = namespaces.get(id);
    this.current_view.destroy();
    if (namespace != null) {
      this.current_view = new NamespaceView.Container({
        model: namespace
      });
    } else {
      this.current_view = new NamespaceView.NotFound(id);
    }
    this.$container.html(this.current_view.render().el);
    if (namespace != null) {
      return this.current_view.shards.render_data_repartition();
    }
  };

  BackboneCluster.prototype.datacenter = function(id, tab) {
    var datacenter;
    this.set_stats_call('ajax/stat?filter=.*/serializers,proc,sys');
    log_router('/datacenters/' + id);
    clear_modals();
    datacenter = datacenters.get(id);
    this.current_view.destroy();
    if (datacenter != null) {
      this.current_view = new DatacenterView.Container({
        model: datacenter
      });
    } else {
      this.current_view = new DatacenterView.NotFound(id);
    }
    return this.$container.html(this.current_view.render().el);
  };

  BackboneCluster.prototype.server = function(id, tab) {
    var machine;
    this.set_stats_call('ajax/stat?machine_whitelist=' + id + '&filter=.*/serializers,proc,sys');
    log_router('/servers/' + id);
    clear_modals();
    machine = machines.get(id);
    this.current_view.destroy();
    if (machine != null) {
      this.current_view = new MachineView.Container({
        model: machine
      });
    } else {
      this.current_view = new MachineView.NotFound(id);
    }
    return this.$container.html(this.current_view.render().el);
  };

  return BackboneCluster;

})(Backbone.Router);

modal_registry = [];

clear_modals = function() {
  var modal, _i, _len;
  for (_i = 0, _len = modal_registry.length; _i < _len; _i++) {
    modal = modal_registry[_i];
    modal.hide_modal();
  }
  return modal_registry = [];
};

register_modal = function(modal) {
  return modal_registry.push(modal);
};

updateInterval = 5000;

statUpdateInterval = 1000;

progress_interval_default_value = 5000;

progress_interval_value = 5000;

progress_short_interval = 1000;

apply_to_collection = function(collection, collection_data) {
  var data, id, machine_uuid, _results;
  _results = [];
  for (id in collection_data) {
    data = collection_data[id];
    if (data !== null) {
      if ((data.protocol != null) && data.protocol === 'rdb') {
        if ((collection_data[id].blueprint != null) && (collection_data[id].blueprint.peers_roles != null)) {
          for (machine_uuid in collection_data[id].blueprint.peers_roles) {
            if (!(machines.get(machine_uuid) != null)) {
              delete collection_data[id].blueprint.peers_roles[machine_uuid];
            }
          }
        }
      }
      if (collection.get(id)) {
        _results.push(collection.get(id).set(data));
      } else {
        data.id = id;
        _results.push(collection.add(new collection.model(data)));
      }
    } else {
      if (collection.get(id)) {
        _results.push(collection.remove(id));
      } else {
        _results.push(void 0);
      }
    }
  }
  return _results;
};

add_protocol_tag = function(data, tag) {
  var f;
  f = function(unused, id) {
    if (data[id]) {
      return data[id].protocol = tag;
    }
  };
  _.each(data, f);
  return data;
};

reset_collections = function() {
  namespaces.reset();
  datacenters.reset();
  machines.reset();
  issues.reset();
  return directory.reset();
};

apply_diffs = function(updates) {
  var collection_data, collection_id;
  if (!connection_status.get('contact_machine_id')) {
    connection_status.set('contact_machine_id', updates["me"]);
  } else {
    if (updates["me"] !== connection_status.get('contact_machine_id')) {
      reset_collections();
      connection_status.set('contact_machine_id', updates["me"]);
    }
  }
  for (collection_id in updates) {
    collection_data = updates[collection_id];
    switch (collection_id) {
      case 'dummy_namespaces':
        apply_to_collection(namespaces, add_protocol_tag(collection_data, "dummy"));
        break;
      case 'databases':
        apply_to_collection(databases, collection_data);
        break;
      case 'rdb_namespaces':
        apply_to_collection(namespaces, add_protocol_tag(collection_data, "rdb"));
        break;
      case 'datacenters':
        apply_to_collection(datacenters, collection_data);
        break;
      case 'machines':
        apply_to_collection(machines, collection_data);
        break;
      case 'me':
        continue;
    }
  }
};

set_issues = function(issue_data_from_server) {
  return issues.reset(issue_data_from_server);
};

set_progress = function(progress_data_from_server) {
  var is_empty, key, value, _pl;
  is_empty = true;
  _pl = [];
  for (key in progress_data_from_server) {
    value = progress_data_from_server[key];
    is_empty = false;
    value['id'] = key;
    _pl.push(value);
  }
  progress_list.reset(_pl);
  if (is_empty === false && progress_interval_value === progress_interval_default_value) {
    clearInterval(window.progress_interval);
    progress_interval_value = progress_short_interval;
    window.progress_interval = setInterval(collect_progress, progress_interval_value);
  } else if (is_empty === true && progress_interval_value === progress_short_interval) {
    clearInterval(window.progress_interval);
    progress_interval_value = progress_interval_default_value;
    window.progress_interval = setInterval(collect_progress, progress_interval_value);
  }
  if (is_empty === false) {
    return setTimeout(collect_server_data_async, 2500);
  }
};

set_directory = function(attributes_from_server) {
  var dir_machines, key, value;
  dir_machines = [];
  for (key in attributes_from_server) {
    value = attributes_from_server[key];
    if (value.peer_type === 'server') {
      value['id'] = key;
      dir_machines[dir_machines.length] = value;
    }
  }
  return directory.reset(dir_machines);
};

set_last_seen = function(last_seen_from_server) {
  var machine_uuid, timestamp, _m, _results;
  _results = [];
  for (machine_uuid in last_seen_from_server) {
    timestamp = last_seen_from_server[machine_uuid];
    _m = machines.get(machine_uuid);
    if (_m) {
      _results.push(_m.set('last_seen', timestamp));
    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

set_stats = function(stat_data) {
  var data, machine_id, mid, _i, _len, _ref, _ref1, _results;
  _results = [];
  for (machine_id in stat_data) {
    data = stat_data[machine_id];
    if (machines.get(machine_id) != null) {
      _results.push(machines.get(machine_id).set('stats', data));
    } else if (machine_id === 'machines') {
      _ref = data.known;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        mid = _ref[_i];
        if ((_ref1 = machines.get(mid)) != null) {
          _ref1.set('stats_up_to_date', true);
        }
      }
      _results.push((function() {
        var _j, _len1, _ref2, _ref3, _results1;
        _ref2 = data.timed_out;
        _results1 = [];
        for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
          mid = _ref2[_j];
          _results1.push((_ref3 = machines.get(mid)) != null ? _ref3.set('stats_up_to_date', false) : void 0);
        }
        return _results1;
      })());
      /*
                  # Ignore these cases for the time being. When we'll consider these, 
                  # we might need an integer instead of a boolean
                  for mid in data.dead
                      machines.get(mid)?.set('stats_up_to_date', false)
                  for mid in data.ghosts
                      machines.get(mid)?.set('stats_up_to_date', false)
      */

    } else {
      _results.push(void 0);
    }
  }
  return _results;
};

set_reql_docs = function(data) {
  return DataExplorerView.Container.prototype.set_docs(data);
};

error_load_reql_docs = function() {
  return console.log('Could not load reql documentation');
};

collections_ready = function() {
  render_body();
  window.router = new BackboneCluster;
  return Backbone.history.start();
};

collect_reql_doc = function() {
  return $.ajax({
    url: 'js/reql_docs.json?v=' + window.VERSION,
    dataType: 'json',
    contentType: 'application/json',
    success: set_reql_docs,
    error: error_load_reql_docs
  });
};

collect_server_data_once = function(async, optional_callback) {
  return $.ajax({
    url: 'ajax',
    dataType: 'json',
    contentType: 'application/json',
    async: async,
    success: function(updates) {
      if (window.is_disconnected != null) {
        delete window.is_disconnected;
        window.location.reload(true);
      }
      apply_diffs(updates.semilattice);
      set_issues(updates.issues);
      set_directory(updates.directory);
      set_last_seen(updates.last_seen);
      if (optional_callback != null) {
        return optional_callback();
      }
    },
    error: function() {
      window.connection_status.set({
        client_disconnected: false
      });
      if (window.is_disconnected != null) {
        return window.is_disconnected.display_fail();
      } else {
        return window.is_disconnected = new IsDisconnected;
      }
    },
    timeout: updateInterval * 3
  });
};

collect_progress = function() {
  return $.ajax({
    contentType: 'application/json',
    url: 'ajax/progress',
    dataType: 'json',
    success: set_progress
  });
};

collect_server_data_async = function() {
  return collect_server_data_once(true);
};

stats_param = {
  url: 'ajax/stat',
  fail: false
};

collect_stat_data = function() {
  return $.ajax({
    url: stats_param.url,
    dataType: 'json',
    contentType: 'application/json',
    success: function(data) {
      set_stats(data);
      stats_param.fail = false;
      return stats_param.timeout = setTimeout(collect_stat_data, 1000);
    },
    error: function() {
      stats_param.fail = true;
      return stats_param.timeout = setTimeout(collect_stat_data, 1000);
    }
  });
};

$(function() {
  window.r = require('rethinkdb');
  render_loading();
  bind_dev_tools();
  window.datacenters = new Datacenters;
  window.databases = new Databases;
  window.namespaces = new Namespaces;
  window.machines = new Machines;
  window.issues = new Issues;
  window.progress_list = new ProgressList;
  window.directory = new Directory;
  window.issues_redundancy = new IssuesRedundancy;
  window.connection_status = new ConnectionStatus;
  window.computed_cluster = new ComputedCluster;
  window.last_update_tstamp = 0;
  window.universe_datacenter = new Datacenter({
    id: '00000000-0000-0000-0000-000000000000',
    name: 'Universe'
  });
  Backbone.sync = function(method, model, success, error) {
    if (method === 'read') {
      return collect_server_data();
    } else {
      return Backbone.sync(method, model, success, error);
    }
  };
  collect_server_data_once(true, collections_ready);
  setInterval(collect_server_data_async, updateInterval);
  window.progress_interval = setInterval(collect_progress, progress_interval_value);
  collect_reql_doc();
  if (typeof rethinkdb !== "undefined" && rethinkdb !== null) {
    return window.r = rethinkdb;
  }
});
