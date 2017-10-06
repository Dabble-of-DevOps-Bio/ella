from marshmallow import Schema, fields


class UserSchema(Schema):
    class Meta:
        fields = ('id',
                  'username',
                  'first_name',
                  'last_name',
                  'full_name',
                  'abbrev_name',
                  'active',
        )

    full_name = fields.Method('get_full_name')
    abbrev_name = fields.Method('get_abbreviated_name')

    def get_full_name(self, obj):
        return ' '.join([obj.first_name, obj.last_name])

    def get_abbreviated_name(self, obj):
        return u" ".join([v[0]+"." for v in [obj.first_name]+obj.last_name.split()[:-1]])+" "+obj.last_name.split()[-1]

class UserGroupGenepanelSchema(Schema):
    class Meta:
        fields = (
          'name',
          'version',
          'genome_reference'
        )

class UserGroupSchema(Schema):
    class Meta:
        fields = ( 'id',
                   'name',
                   'genepanels'
        )
    genepanels = fields.Nested(UserGroupGenepanelSchema, many=True)

class UserFullSchema(Schema):
    class Meta:
        fields = ('id',
                  'username',
                  'first_name',
                  'last_name',
                  'full_name',
                  'abbrev_name',
                  'active',
                  'password_expiry',
                  'group',
                  'otherUsersInGroup'
        )

    full_name = fields.Method('get_full_name')
    abbrev_name = fields.Method('get_abbreviated_name')
    group = fields.Nested(UserGroupSchema)
    otherUsersInGroup = fields.Nested('self',exclude=('otherUsersInGroup'), only=['first_name', 'last_name', 'username'], many=True)

    def get_full_name(self, obj):
        return ' '.join([obj.first_name, obj.last_name])

    def get_abbreviated_name(self, obj):
        return u" ".join([v[0]+"." for v in [obj.first_name]+obj.last_name.split()[:-1]])+" "+obj.last_name.split()[-1]
