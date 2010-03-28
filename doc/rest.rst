The REST API
============

The JSonic server implements a REST interface providing information about available speech engines, synthesizing speech to audio files, and fetching speech files. The server sets the HTTP status code properly on every response to indicate whether a request was process successfully (e.g., 200, 206) or an error occurred (e.g., 500).

GET /engine
-----------

Gets a list of all available speech engines. The response body contains a JSON encoded object adhering to the following schema on success.

.. sourcecode:: javascript

   {
      "description" : "Response object including a list of available speech engines",
      "type" : "object",
      "properties" : {
         "success" : {
            "description" : "True to indicate success",
            "type" : "bool",
            "default" : true
         },
         "result" : {
            "description" : "List of speech engine identifiers",
            "type" : "array",
            "items" : "string"
         }
      }
   }

The response body contains a JSON encoded object adhering to the following schema on failure if possible.

.. sourcecode:: javascript

   {
      "description" : "Error response object",
      "type" : "object",
      "properties" : {
         "success" : {
            "description" : "False to indicate an error",
            "type" : "boolean",
            "default" : false
         },
         "description" : {
            "description" : "Human readable description of the error",
            "type" : "string"
         }
      }
   }

GET /engine/[id]
----------------

Gets information about the particular speech engine named by its identifier. The response body contains a JSON encoded object adhering to the following schema.

.. sourcecode:: javascript

   {
      "description" : "Response object including properties supported by the speech engine",
      "type" : "object",
      "properties" : {
         "success" : {
            "description" : "True to indicate success",
            "type" : "bool",
            "default" : true
         },
         "result" : {
            "description" : "Object with names of supported engine properties",
            "type" : "object",
            "properties" : {
               "voices" : {
                  "description" : "Object describing synthesizer voices",
                  "type" : "object",
                  "properties" : {
                     "values" : {
                        "description" : "List of available voice identifiers",
                        "type" : "array",
                        "items" : "string"
                     },
                     "default" : {
                        "description" : "Default voice identifier used if none provided in a /synth request",
                        "type" : "string"
                     }
                  }
               },
               "rate" : {
                  "description" : "Object describing rate of speech in words per minute (WPM)",
                  "type" : "object",
                  "properties" : {
                     "minimum" : {
                        "description" : "Minimum supported WPM",
                        "type" : "integer"
                     },
                     "maximum" : {
                        "description" : "Maximum supported WPM",
                        "type" : "integer"
                     },
                     "default" : {
                        "description" : "Default WPM used when if none provided in a /synth request. Should be 200 WPM whenever possible."
                        "type" : "integer",
                        "default" : 200
                     }
                  }
               },
               "pitch" : {
                  "description" : "Object describing speech baseline pitch",
                  "type" : "object",
                  "properties" : {
                     "minimum" : {
                        "description" : "Minimum supported pitch. Should be 0.0 if pitch is supported or the default value if not.",
                        "type" : "number",
                        "minimum" : 0.0,
                        "minimumCanEqual" : true,
                        "default" : 0.0
                     },
                     "maximum" : {
                        "description" : "Maximum supported pitch. Should be 1.0 if pitch is supported or the default value if not.",                        
                        "type" : "number",
                        "maximum" : 1.0,
                        "maximumCanEqual" : true,
                        "default" : 1.0 
                     },
                     "default" : {
                        "description" : "Default pitch used when if none provided in a /synth request. Should be 0.5 whenever possible."
                        "type" : "number",
                        "minimum" : 0.0,
                        "maximum" : 1.0,
                        "default" : 0.5
                     }
                  }                  
               }
            }
         }
      }
   }

The response body contains a JSON encoded object adhering to the following schema on failure if possible.

.. sourcecode:: javascript

   {
      "description" : "Error response object",
      "type" : "object",
      "properties" : {
         "success" : {
            "description" : "False to indicate an error",
            "type" : "boolean",
            "default" : false
         },
         "description" : {
            "description" : "Human readable description of the error",
            "type" : "string"
         }
      }
   }

POST /synth
-----------

Posts information about one or more utterances to synthesize to web accessible files. The request body contains a JSON encoded object adhering to the following schema.

.. sourcecode:: javascript

   {
      "description" : "Request object including a utterances to synthesize and their properties",
      "type" : "object",
      "properties" : {
         "format" : {
            "description" : "Requested audio encoding for the utterance files",
            "type" : "string",
            "enum" : [".ogg", ".mp3"]
         },
         "utterances" : {
            "description" : "Object containing utterances to synthesize keyed by unique identifiers to be returned in the response",
            "type" : "object",
            "additionalProperties" : true
         },
         "properties" : {
            "description" : "Object with properties configuring the speech synthesizer for the utterances",
            "type" : "object",
            "properties" : {
               "voice" : {
                  "description" : "One of the voice names returned by /engine/[id] to use for the utterances",
                  "type" : "string"
               },
               "rate" : {
                  "description" : "The rate of speech to use in words per minute (WPM) in the range indicated by /engine/[id]",
                  "type" : "integer"
               },
               "pitch" : {
                  "description" : "The baseline pitch of speech to use in the range indicated by /engine[id]",
                  "type" : "number"
               }
            }
         }
      }
   }


The response body contains a JSON encoded object adhering to the following schema on success.

.. sourcecode:: javascript

   {
      "description" : "Response object including URLs of synthesized utterances",
      "type" : "object",
      "properties" : {
         "result" : {
            "description" : "Object containing URLs to synthesized utterances keyed by unique identifiers sent in the request",
            "type" : "object",
            "additionalProperties" : true
         }
      }
   }

The response body contains a JSON encoded object adhering to the following schema on failure if possible.

.. sourcecode:: javascript

   {
      "description" : "Error response object",
      "type" : "object",
      "properties" : {
         "success" : {
            "description" : "False to indicate an error",
            "type" : "boolean",
            "default" : false
         },
         "description" : {
            "description" : "Human readable description of the error",
            "type" : "string"
         }
      }
   }

GET /files/[id]
---------------

Gets a synthesized speech file previously created by `/synth`. For status codes in the 200s, the response body contains the bytes of the file, possibly limited to a range specified in the request.